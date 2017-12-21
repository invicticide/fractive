{{Start}}

This story demonstrates how you to use two of the stock aliases, `\{nextButton\}`
and `\{previousButton\}`, to make writing a linear story more convenient.

{nextButton}

{{Section2}}

Ordinarily, even if the flow of your story is simple, moving from one section to
the one declared immediately after it, sections must be linked like so:

`[Link](\{@Section3})`

What if we wanted to insert a new section in between `Section2` and `Section3`
called `MiddleSection`? We'd need to carefully update the link in `Section2`
to avoid skipping your new section.

{previousButton} {nextButton}

{{Section3}}

If your `fractive.json` contains the following line:

`useStockAliases: true`

then you will be able to type `\{nextButton\}` to insert a link which leads to
the section defined after the current one in Markdown. You don't need to update
the link if the section changes.

{previousButton} {nextButton}

{{LastSection}}

If you want to let the reader also go backwards, to the section declared previously,
you can use the `\{previousButton\}` alias.

Be careful, though. If your story contains both a traditional back button
placed in the template using `<!--\{backButton\}-->`, and previous buttons
placed in the story using `\{previousButton\}`, your reader may get confused.
These buttons actually serve different purposes:

* The back button rewinds the user to whichever section they were last viewing.
  (This is good for non-linear stories.)
* The previous button moves the user to the section defined in Markdown before
  the current one. (This is good for linear stories.)

{previousButton}
