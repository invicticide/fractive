{{Start}}

# The joy of tagging links!

You may have noticed in the previous examples, links to external websites were marked with a special symbol. That symbol comes from
[Font Awesome.](http://fontawesome.io/) (There it is again!)

You can actually customize what appears next to any link in your story by defining a link tag. These are defined in your story's `fractive.json` file under the name `linkTags`.

```
\{
  ...
  "linkTags": \{
    "external": "[any HTML]",
    "inline": "[any HTML]",
    "section": "[any HTML]",
    "function": "[any HTML]"
  \}
\}
```

This example story defines all of the link tags. Take a look:

[Some External Link](http://balladofthespacebard.com/)
[Some Inline Link]({$InlineExpansionVariable:inline})
[Some Function Link]({#FunctionLink})
[Some Inline Function Link]({#InlineExpansionFunction:inline})
[Some Section Link]({@Start})

**More info**:
[Customizing tag appearance.]({@FontAwesome})
[When and why to use tags.]({@WhenTags})

{{FontAwesome}}

We've chosen to use icons from Font Awesome for each of the link tags, but you can think bigger. For example, you might use an `<img>` tag to use your own icon as a tag:

```
\{
  ...
  "linkTags": \{
    "external": "<img src=\\"assets/externalLink.png\\"></img>"
  \}
\}
```

Remember to mark quotation marks inside the link definition with a `\\` to avoid errors.

{{WhenTags}}

Tags are useful for helping the player know what to expect before they click on a link. Some players want to experience everything they can in a section before moving on to the next one, making the section tag especially useful.

However, an excess of tags can visually clutter your story. We recommend you only define the most important ones depending on the way you structure your story. For example, if you use a lot of inline links, you might want to tag only the external links and section links.
