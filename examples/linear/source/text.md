{{Start}}

# Linear Stories

It's common to write Fractive stories (or sequences inside larger stories)
that are linear, meaning that each section simply leads to whichever section
is declared below it in the Markdown files. If you have a story organized as
follows, you might run into annoyance:

```
\{{Section1}}
...
[Next](\{@Section2})

\{{Section2}}
...
[Next](\{@Section3})
{$insertMarkdown}
\{{Section3}}
...
[Next](\{@Section4})
```

[Add another section]({#addSection})

{{Section2}}

Fractive implements 2 convenience macros for you to use in your section links,
`\{@^up}` and `\{@^down}`. When inserted as the destination of a link, these
macros will tell the story to simply flow to whichever section was declared
physically above or below the current section in your Markdown files. We can
rewrite the last example like this:

```
\{{Section1}}
...
[Next](\{@^down})

\{{Section2}}
...
[Next](\{@^down})

\{{Section2.5}}
...
[Next](\{@^down})

\{{Section3}}
...
[Next](\{@^down})
```

Now no matter how many sections we insert between the existing ones,
the linear flow will be preserved the way we expect it to.

[Next]({@^down})

{{Section3}}

We can make things even easier on ourselves by declaring a aliases in `fractive.json`:

```
"aliases": [
  \{ "alias": "up", "replaceWith": "[Back]({@^up})" },
  \{ "alias": "down", "replaceWith": "[Forward]({@^down})" }
]
```

These aliases will let us rewrite our Markdown one last time, even cleaner
and with the added benefit of a back button wherever it's needed:

```
\{{Section1}}
...
\{down}

\{{Section2}}
...
\{up} \{down}

\{{Section2.5}}
...
\{up} \{down}

\{{Section3}}
...
\{up} \{down}
```

{down}

{{Section4}}

Your story doesn't have to be completely linear for this to come in handy. Maybe
you're making a branching story, but some scenes along the branches follow
a linear structure. The `\{@^up}` and `\{@^down}` links aren't added to your
sections automatically like the back button is, so you can use them when you need to,
and drop them when you don't. [Or...]({@Section5:inline})

We hope this feature comes in handy!

{{Section5}}

Or, you could even go crazy and write an OnGotoSection callback which detects
sections that should link forward and backward, then adds the links automatically
at the bottom.

{{Section1Addendum}}

Now that we've added a section in between two others, we've created a problem.
The story will skip from `@Section2` to `@Section3` because the links explicitly
reference their destination sections by name. We now remember to update the link
in `@Section2` so it points to `@Section2.5`.

[Next]({@^down})
