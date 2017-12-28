{{Start: Tutorial}}

# The joy of tagging sections!

This example shows some of the cool things you can do with section tags.
(Not to be confused with link tags).

Section tags are applied to a section declaration like this:

You can use the following functions in `Core` to play around with tags:

* `Core.GetSectionTags(id)`
* `Core.GetCurrentSectionTags()`
* `Core.GetSectionsWithTag(tag)`

Here's a list of the current section's tags: {#listCurrentTags}
Here's a list of sections with the Person1 tag: {#listPerson1Sections}
Here's a list of sections with the Person2 tag: {#listPerson2Sections}

You can also write functions that will be called automatically when your reader
goes to a new section, like the one this example contains in `script.js`.

[What else can you do with section tags?]({@OtherIdeas})

In this story, as a result of the code in `script.js`, every section we tagged with `Tutorial`
will be followed by a short tutorial message.

{{OtherIdeas: Person1}}

You could use section tags to list images that need to be displayed next to
each section.

[Next]({@Conversation2})

{{Conversation2: Person2}}

These tags could include a different background, or multiple character portraits,
for each section of a visual novel.

[Next]({@Conversation3})

{{Conversation3: Person1}}

Hope you've enjoyed this example and find interesting ways to use tags in your
stories!
