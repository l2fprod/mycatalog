node -e "require('./retrieve.js')().run(null)"
node -e "require('./cheatsheet.js')().generate(false, 'public/generated/cheatsheet.pdf')"
node -e "require('./cheatsheet.js')().generate(true, 'public/generated/cheatsheet-dark.pdf')"
