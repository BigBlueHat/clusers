[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Patreon](https://img.shields.io/badge/donate-patreon-orange.svg?style=flat-square)](https://www.patreon.com/BigBlueHat)

# Clusers
#### Make CouchDB style `_users` Users on Cloudant

[Cloudant](http://cloudant.com/) doesn't have user management...so much...

Enter, the `_users` table from [Apache CouchDB](http://couchdb.apache.org/)!

This little CouchApp currently (just) creates users in your `_users` database
in the Cloudant account you've already setup (right?). You'll still need to set
`"couchdb_auth_only": true` on the `_security` object of the databases you want
to use with these new accounts. Eventually, this app will do that too...but it
doesn't just yet.

## Usage

```
$ npm i
$ gulp
$ gulp couchapp --url=http://{API_KEY}:{API_SECRET}@{USER}.cloudant.com/clusers
```

Then visit:
`http://{USER}.cloudant.com/clusers/_design/clusers/index.html` and fill out
the form. :smiley_cat:

# License

MIT
