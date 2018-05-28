{{SectionTags: Start, Tutorial}}

# The joy of tagging sections!

This example shows some of the cool things you can do with section tags.
(Not to be confused with link tags).

Section tags are applied to a section declaration like this: `\{{SectionName: tag1, tag2}}`

You can use the following functions in `Core` to play around with tags:

* `Core.GetSectionTags(id)`
* `Core.GetCurrentSectionTags()`
* `Core.GetSectionsWithTag(tags)`

You can also write functions that will be called automatically when your reader
goes to a new section, like this:

```
Core.AddEventListener("OnGotoSection", function(id, element, tags, reason)
\{
	if (tags.indexOf("Tutorial") !== -1)
	\{
		document.getElementById('__currentSection').innerHTML += `<p>Click on links to read through the story.</p>`;
	}
});
```

[What else can you do with section tags?]({@OtherIdeas})

In this story, as a result of the code above, every section we tagged with `Tutorial`
will be followed by a short tutorial message.

{{OtherIdeas: Person1}}

You could use section tags to list images that need to be displayed next to
each section.

[Next]({@Conversation2})

{{Conversation2: Person2}}

These tags could include a different background, or multiple character portraits,
for each section of a visual novel.
