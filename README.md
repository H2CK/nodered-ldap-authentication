# Node-RED Editor LDAP Authentication
The provided js files provide a custom authentication for Node-RED editor using LDAP. The implementation is based on the approach described at https://nodered.org/docs/user-guide/runtime/securing-node-red#custom-user-authentication

## Features

- Check if user can be found (SEARCH) and authenticated (BIND) against a LDAP server
- Set Node-RED roles (admin|guest) based on group membership. (Uses memberOf attribute of user)

## Installation Procedure

Follow the steps to install the custom LDAP authentication functionality

1. Install necessary dependencies to your Node-RED installation by executing `npm install ldapjs` or `npm install ldapjs -g` if you installed Node-RED globally.
2. Clone this repository and copy user_authentication.js to your Node-RED installation (in the same directory where youbb find settings.js).
3. Modify configuration properties in the beginning of the file user_authentication.js according to your environment (see next section).
4. Set the adminAuth property in settings.js (of youe Node-RED installation) to load this module: 
  ```adminAuth: require("./user-authentication")```

## Configuration Properties

| Configuration Property | Description |
|---|---|
| baseDn | Base DN where the users will be found in LDAP tree. E.g. `ou=people,dc=example,dc=com` |
| bindDn | DN of admin user by which a bind to the LDAP server is performed to search for users. E.g. `cn=admin,dc=example,dc=com` |
| bindCredentials | Password of the bind user. |
| filter | Additional filter to apply, when querying for users. For example you might limit the query to specific groups |
| idAttribute | LDAP attribute which contains the username, by which the user login in at Node-RED. E.g. `uid` |
| adminGroupDn | DN of the group the user must be a member of to be granted admin rights. E.g. `cn=node-red-admin,ou=groups,dc=example,dc=com` |
| guestGroupDn | DN of the group the user must be a member of to be granted read rights. E.g. `cn=node-red-guest,ou=groups,dc=example,dc=com` |
