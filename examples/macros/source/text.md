{{TestSection}}

Expanded section!

{{Start}}

# Text

Expand a section in a `text` element: {@TestSection}
Expand a function in a `text` element: {#TestFunction}
Expand a variable in a `text` element: {$TestVariable}

Non-expanding reference to a section in a `text` element: \\{@TestSection}
Non-expanding reference to a function in a `text` element: \\{#TestFunction}
Non-expanding reference to a variable in a `text` element: \\{$TestVariable}

Display a backslash: \\

Expand a nested function: {#Nestor.NestedFunction}
Expand a nested variable: {$Nestor.NestedVariable}

# Aliases

Aliases are {TestAdjective}!

Aliases can enable {red}clean inline styling{/red}!

# Links

[Link to a section]({@TestSection})
[Link to a function]({#LinkedFunction})

[Link with a section in the label: {@TestSection}](#)
[Link with a function in the label: {#TestFunction}](#)
[Link with a variable in the label: {$TestVariable}](#)

[Link with an expanded macro ({$TestVariable}) in its label]({@TestSection})

# Images

![Image with a direct url](assets/avatar.png)
![Image with a function url]({#ImageFunction})
![Image with a variable url]({$ImageVariable})

# Emphasis

Expand a section in an `emph` element: *{@TestSection}*
Expand a function in an `emph` element: *{#TestFunction}*
Expand a variable in an `emph` element: *{$TestVariable}*

Non-expanding reference to a section in an `emph` element: *\\{@TestSection}*
Non-expanding reference to a function in an `emph` element: *\\{#TestFunction}*
Non-expanding reference to a variable in an `emph` element: *\\{$TestVariable}*

Expand a section with surrounding content in an `emph` element: *reference > {@TestSection} < reference*
Expand a function with surrounding content in an `emph` element: *reference > {#TestFunction} < reference*
Expand a variable with surrounding content in an `emph` element: *reference > {$TestVariable} < reference*

Non-expanding reference to a section with surrounding content in an `emph` element: *reference > \\{@TestSection} < reference*
Non-expanding reference to a function with surrounding content in an `emph` element: *reference > \\{#TestFunction} < reference*
Non-expanding reference to a variable with surrounding content in an `emph` element: *reference > \\{$TestVariable} < reference*

# Strong

Expand a section in a `strong` element: **{@TestSection}**
Expand a function in a `strong` element: **{#TestFunction}**
Expand a variable in a `strong` element: **{$TestVariable}**

Non-expanding reference to a section in a `strong` element: **\\{@TestSection}**
Non-expanding reference to a function in a `strong` element: **\\{#TestFunction}**
Non-expanding reference to a variable in a `strong` element: **\\{$TestVariable}**

Expand a section with surrounding content in a `strong` element: **reference > {@TestSection} < reference**
Expand a function with surrounding content in a `strong` element: **reference > {#TestFunction} < reference**
Expand a variable with surrounding content in a `strong` element: **reference > {$TestVariable} < reference**

Non-expanding reference to a section with surrounding content in a `strong` element: **reference > \\{@TestSection} < reference**
Non-expanding reference to a function with surrounding content in a `strong` element: **reference > \\{#TestFunction} < reference**
Non-expanding reference to a variable with surrounding content in a `strong` element: **reference > \\{$TestVariable} < reference**

# Code

Expand a section in an inline `code` element: `{@TestSection}`
Expand a function in an inline `code` element: `{#TestFunction}`
Expand a variable in an inline `code` element: `{$TestVariable}`

Expand a section with surrounding content in an inline `code` element: `reference > {@TestSection} < reference`
Expand a function with surrounding content in an inline `code` element: `reference > {#TestFunction} < reference`
Expand a variable with surrounding content in an inline `code` element: `reference > {$TestVariable} < reference`

Non-expanding reference to a section in an inline `code` element: `\{@TestSection}`
Non-expanding reference to a function in an inline `code` element: `\{#TestFunction}`
Non-expanding reference to a variable in an inline `code` element: `\{$TestVariable}`

Non-expanding reference to a section with surrounding content in an inline `code` element: `reference > \{@TestSection} < reference`
Non-expanding reference to a function with surrounding content in an inline `code` element: `reference > \{#TestFunction} < reference`
Non-expanding reference to a variable with surrounding content in an inline `code` element: `reference > \{$TestVariable} < reference`

# Code block

Expand a section in an indented `code_block`:

	{@TestSection}

Expand a function in an indented `code_block`:

	{#TestFunction}

Expand a variable in an indented `code_block`:

	{$TestVariable}

Expand a section with surrounding content in an indented `code_block`:

	// Begin reference
	{@TestSection}
	// End reference

Expand a function with surrounding content in an indented `code_block`:

	// Begin reference
	{#TestFunction}
	// End reference

Expand a variable with surrounding content in an indented `code_block`:

	// Begin reference
	{$TestVariable}
	// End reference

Non-expanding reference to a section in an indented `code_block`:

	\{@TestSection}

Non-expanding reference to a function in an indented `code_block`:

	\{#TestFunction}

Non-expanding reference to a variable in an indented `code_block`:

	\{$TestVariable}

Non-expanding reference to a section with surrounding content in an indented `code_block`:

	// Begin reference
	\{@TestSection}
	// End reference

Non-expanding reference to a function with surrounding content in an indented `code_block`:

	// Begin reference
	\{#TestFunction}
	// End reference

Non-expanding reference to a variable with surrounding content in an indented `code_block`:

	// Begin reference
	\{$TestVariable}
	// End reference

# Code fence

Expand a section in a fenced `code_block`:

```{@TestSection}```

Expand a function in a fenced `code_block`:

```{#TestFunction}```

Expand a variable in a fenced `code_block`:

```{$TestVariable}```

Expand a section with surrounding content in a fenced `code_block`:

```
// Begin reference
{@TestSection}
// End reference
```

Expand a function with surrounding content in a fenced `code_block`:

```
// Begin reference
{#TestFunction}
// End reference
```

Expand a variable with surrounding content in a fenced `code_block`:

```
// Begin reference
{$TestVariable}
// End reference
```

Non-expanding reference to a section in a fenced `code_block`:

```\{@TestSection}```

Non-expanding reference to a function in a fenced `code_block`:

```\{#TestFunction}```

Non-expanding reference to a variable in a fenced `code_block`:

```\{$TestVariable}```

Non-expanding reference to a section with surrounding content in a fenced `code_block`:

```
// Begin reference
\{@TestSection}
// End reference
```

Non-expanding reference to a function with surrounding content in a fenced `code_block`:

```
// Begin reference
\{#TestFunction}
// End reference
```

Non-expanding reference to a variable with surrounding content in a fenced `code_block`:

```
// Begin reference
\{$TestVariable}
// End reference
```

# Other formatting

> This is a blockquote. It expands a function ({#TestFunction}) and a variable ({$TestVariable}) and finally a section: {@TestSection}

* Here is a list item expanding a function: {#TestFunction}
* List item expanding a variable: {$TestVariable}
	* Child item with a function: {#TestFunction}
	* Child with a variable: {$TestVariable}
* List item with a section (this is probably nonsense): {@TestSection}
	* Child with a section (also nonsense): {@TestSection}

## Here's a heading expanding a function: {#TestFunction}

## Heading with a variable: {$TestVariable}

## Heading with a section (nonsense): {@TestSection}

<div>
<p><span style="color:blue">Here's some inline HTML that expands a function: {#TestFunction}</span></p>
<p><span style="color:red">Inline HTML that expands a variable: {$TestVariable}</span></p>
<p><span style="color:green">Inline HTML that expands a section: {@TestSection}</span></p>
</div>
