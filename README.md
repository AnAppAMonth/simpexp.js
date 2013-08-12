# simpexp.js

simpexp.js is a fork of [randexp.js](http://fent.github.io/randexp.js/) that will generate a simplest (shortest) string
that matches a given RegExp, in a deterministic way (so that the same regex always
generates the same string).


# Usage
```js
var SimpExp = require('simpexp');

// supports grouping and piping
new SimpExp(/hello+ (world|to you)/).gen();
// => hello world

// shorter is better
new SimpExp(/hello+ (world|to u)/).gen();
// => hello to u

// a real-life example
new SimpExp(/<\s*br(?:[\s/]*|\s[^>]*)>/i).gen();
// => <br>

// sets and ranges and references
new SimpExp(/<([a-z]\w{0,20})>foo<\1>/).gen();
// => <a>foo<a>

// dynamic regexp shortcut
new SimpExp('(sun|mon|tue|wednes|thurs|fri|satur)day', 'i');
// is the same as
new SimpExp(new RegExp('(sun|mon|tue|wednes|thurs|fri|satur)day', 'i'));
```

If you're only going to use `gen()` once with a regexp and want slightly shorter
syntax for it

```js
var simpexp = require('simpexp').simpexp;

simpexp(/[1-6]/); // 1
simpexp('great|good( job)?|excellent'); // good
```

If you miss the old syntax

```js
require('simpexp').sugar();

/yes|no|maybe|i don't know/.gen(); // no
```


# Motivation
Generating a simplest string that matches a given regex helps you capture the
essence of the regex, and therefore understand what it does. Additionally, when
a regex is created to match various variations of a pattern, the simplest string
that matches the regex is often the most natural form of the pattern.

This tool can also help you check correctness of complex regular expressions. By
trying to minimize the length of the match, it may help expose loopholes in your
regex that allow unintended strings to be matched.


# randexp.js
Special thanks to Roly Fentanes and his `randexp.js` library, on which this little
library is based. You can also find more information [there](https://github.com/fent/randexp.js).

# Install
### Node.js

    npm install simpexp

# License
MIT
