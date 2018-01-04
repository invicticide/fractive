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

\{{Section3}}
...
[Next](\{@^down})
```

[Next]({@^down})

{{Section3}}

boop

{{Section1Addendum}}

Now that we've added a section in between two others, we've created a problem.
The story will skip from `@Section2` to `@Section3` because the links explicitly
reference their destination sections by name. We now remember to update the link
in `@Section2` so it points to `@Section2.5`.

[Next]({@^down})
