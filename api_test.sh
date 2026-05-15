#!/usr/bin/env bash
BASE="http://localhost:3000"
PASS=0; FAIL=0

json() { echo "$1" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d$2||'')" 2>/dev/null; }
jsonarr() { echo "$1" | node -e "const a=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log($2)" 2>/dev/null; }

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  OK   $label (HTTP $actual)"
    PASS=$((PASS+1))
  else
    echo "  FAIL $label --- expected:$expected actual:$actual"
    FAIL=$((FAIL+1))
  fi
}

echo "========================================"
echo " TodoListApp API curl test"
echo "========================================"

echo ""
echo "[CLEANUP - remove leftover test accounts]"

for EMAIL in "minjun@example.com" "sujin@example.com"; do
  RES=$(curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"securePass1!\"}")
  OLD_TOKEN=$(json "$RES" ".accessToken")
  if [ -n "$OLD_TOKEN" ]; then
    curl -s -X DELETE "$BASE/api/users/me" -H "Authorization: Bearer $OLD_TOKEN" > /dev/null
    echo "  cleaned: $EMAIL"
  fi
done

echo ""
echo "[AUTH]"

# SCN-01: register minjun
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"minjun@example.com","password":"securePass1!","name":"minjun"}')
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-01 register (minjun)" 201 "$STATUS"
TOKEN_A=$(json "$BODY" ".accessToken")

# SCN-01: register sujin
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"sujin@example.com","password":"securePass1!","name":"sujin"}')
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-01 register (sujin)" 201 "$STATUS"
TOKEN_B=$(json "$BODY" ".accessToken")

# SCN-12: duplicate email -> 409
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"minjun@example.com","password":"securePass1!","name":"dup"}')
check "SCN-12 duplicate email -> 409" 409 "$(echo "$RES" | tail -1)"

# SCN-13: password too short -> 400
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"1234","name":"short"}')
check "SCN-13 password too short -> 400" 400 "$(echo "$RES" | tail -1)"

# SCN-02: login success
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"minjun@example.com","password":"securePass1!"}')
check "SCN-02 login success -> 200" 200 "$(echo "$RES" | tail -1)"

# SCN-14: unknown email -> 401
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ghost@example.com","password":"securePass1!"}')
check "SCN-14 unknown email -> 401" 401 "$(echo "$RES" | tail -1)"

# SCN-15: wrong password -> 401
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"minjun@example.com","password":"wrongpassword"}')
check "SCN-15 wrong password -> 401" 401 "$(echo "$RES" | tail -1)"

echo ""
echo "[USER]"

# get my info
RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/users/me" \
  -H "Authorization: Bearer $TOKEN_A")
check "get my info -> 200" 200 "$(echo "$RES" | tail -1)"

# SCN-03: update name
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/users/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name":"minjunKim"}')
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-03 update name -> 200" 200 "$STATUS"
echo "     name: $(json "$BODY" ".name")"

# SCN-16: no token -> 401
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/users/me" \
  -H "Content-Type: application/json" \
  -d '{"name":"notoken"}')
check "SCN-16 no token -> 401" 401 "$(echo "$RES" | tail -1)"

echo ""
echo "[CATEGORY]"

# list categories -> extract default cat id
RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/categories" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "list categories -> 200" 200 "$STATUS"
DEFAULT_CAT_ID=$(jsonarr "$BODY" "a.find(c=>c.isDefault).id")
echo "     default categoryId: $DEFAULT_CAT_ID"

# SCN-09: create custom category
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name":"SideProject"}')
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-09 create custom category -> 201" 201 "$STATUS"
CUSTOM_CAT_ID=$(json "$BODY" ".id")
echo "     customCategoryId: $CUSTOM_CAT_ID"

# SCN-21: duplicate category name -> 409
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"name":"SideProject"}')
check "SCN-21 duplicate category name -> 409" 409 "$(echo "$RES" | tail -1)"

# SCN-23: delete default category -> 403
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/categories/$DEFAULT_CAT_ID" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-23 delete default category -> 403" 403 "$(echo "$RES" | tail -1)"

echo ""
echo "[TODO]"

# SCN-04: create todo with dueDate (default category)
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/todos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"title\":\"Weekly Report\",\"categoryId\":\"$DEFAULT_CAT_ID\",\"description\":\"Friday deadline\",\"dueDate\":\"2026-05-17\"}")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-04 create todo with dueDate -> 201" 201 "$STATUS"
TODO_ID=$(json "$BODY" ".id")
echo "     todoId: $TODO_ID"

# create todo linked to CUSTOM category (for SCN-22 test)
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/todos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"title\":\"SideTodo\",\"categoryId\":\"$CUSTOM_CAT_ID\"}")
BODY=$(echo "$RES" | head -1)
SIDE_TODO_ID=$(json "$BODY" ".id")

# sujin creates a todo (for 403 tests)
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/todos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"title\":\"SujinTodo\",\"categoryId\":\"$DEFAULT_CAT_ID\"}")
BODY=$(echo "$RES" | head -1)
TODO_B_ID=$(json "$BODY" ".id")

# SCN-17: missing categoryId -> 400
RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/todos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title":"NoCategoryTodo"}')
check "SCN-17 missing categoryId -> 400" 400 "$(echo "$RES" | tail -1)"

# list todos
RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/todos" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "list todos -> 200" 200 "$STATUS"
COUNT=$(jsonarr "$BODY" "a.length")
echo "     todo count: $COUNT"

# SCN-08: filter incomplete + date range
RES=$(curl -s -w "\n%{http_code}" \
  -X GET "$BASE/api/todos?isCompleted=false&startDate=2026-05-13&endDate=2026-05-17" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-08 filter (incomplete+date) -> 200" 200 "$STATUS"
FILTERED=$(jsonarr "$BODY" "a.length")
echo "     filtered count: $FILTERED"

# SCN-05: update dueDate
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/todos/$TODO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"dueDate":"2026-05-18"}')
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-05 update dueDate -> 200" 200 "$STATUS"
echo "     new dueDate: $(json "$BODY" ".dueDate")"

# SCN-18: minjun updates sujin todo -> 403
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/todos/$TODO_B_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"title":"hacked"}')
check "SCN-18 update other user todo -> 403" 403 "$(echo "$RES" | tail -1)"

# SCN-07: toggle complete false->true
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/todos/$TODO_ID/complete" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-07 toggle complete -> 200" 200 "$STATUS"
echo "     isCompleted: $(json "$BODY" ".isCompleted")"

# SCN-07: re-toggle true->false
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/todos/$TODO_ID/complete" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(echo "$RES" | tail -1); BODY=$(echo "$RES" | head -1)
check "SCN-07 re-toggle back to false -> 200" 200 "$STATUS"
echo "     isCompleted: $(json "$BODY" ".isCompleted")"

# SCN-20: minjun toggles sujin todo -> 403
RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/api/todos/$TODO_B_ID/complete" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-20 toggle other user todo -> 403" 403 "$(echo "$RES" | tail -1)"

# SCN-22: delete custom category that has todos -> 409
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/categories/$CUSTOM_CAT_ID" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-22 delete category with todos -> 409" 409 "$(echo "$RES" | tail -1)"

# SCN-06: delete main todo
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/todos/$TODO_ID" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-06 delete todo -> 204" 204 "$(echo "$RES" | tail -1)"

# SCN-19: delete already-deleted todo -> 404
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/todos/$TODO_ID" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-19 delete non-existent todo -> 404" 404 "$(echo "$RES" | tail -1)"

# delete side todo so custom category becomes empty
curl -s -X DELETE "$BASE/api/todos/$SIDE_TODO_ID" \
  -H "Authorization: Bearer $TOKEN_A" > /dev/null

# SCN-10: delete now-empty custom category -> 204
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/categories/$CUSTOM_CAT_ID" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-10 delete empty category -> 204" 204 "$(echo "$RES" | tail -1)"

echo ""
echo "[USER - withdraw]"

# SCN-24: no token -> 401
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/users/me")
check "SCN-24 withdraw no token -> 401" 401 "$(echo "$RES" | tail -1)"

# SCN-11: withdraw minjun
RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/api/users/me" \
  -H "Authorization: Bearer $TOKEN_A")
check "SCN-11 withdraw -> 204" 204 "$(echo "$RES" | tail -1)"

# after withdrawal, user no longer exists -> 404 (JWT is stateless, signature still valid)
RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE/api/users/me" \
  -H "Authorization: Bearer $TOKEN_A")
check "user not found after withdrawal -> 404" 404 "$(echo "$RES" | tail -1)"

# cleanup sujin
curl -s -X DELETE "$BASE/api/users/me" -H "Authorization: Bearer $TOKEN_B" > /dev/null
echo "  cleaned up sujin@example.com"

echo ""
echo "========================================"
echo " RESULT: PASS=$PASS  FAIL=$FAIL  TOTAL=$((PASS+FAIL))"
echo "========================================"
