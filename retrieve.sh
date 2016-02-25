TOKEN=$(cf oauth-token | grep earer | cut -c8-)
echo "Token is $TOKEN"

node retrieve.js $TOKEN
node generate.js
