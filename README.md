## Installation

You can run application locally via cloning current repo to your machine.

```
git clone <repo-url>
```

For example:

```
git clone https://github.com/Novorock/casual-draw
```

[Node.js](https://nodejs.org/) is required to be installed. The project should not be version sensetive, but better to use v18.15.0 and later. Run command line from project root directory and execute the following command:

```
npm install
```

TypeScript transpiler and local http-server will be retrieved. Then you need to transpile TypeScript libraries to JavaScript by executing the following:

```
./node_modules/typescript/bin/tsc
```

Finally, start local server by:

```
./node_modules/.bin/http-server -a localhost -p 8080
```

and open browser on localhost: http://localhost:8080/