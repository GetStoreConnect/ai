# Liquid Filters Reference

Complete reference for the Liquid filters available in StoreConnect templates — standard Liquid filters plus every StoreConnect-defined filter.

Also available (standard Liquid 5.x, not detailed below): `base64_encode`, `base64_decode`, `base64_url_safe_encode`, `base64_url_safe_decode`, `replace_last`, `remove_last`, `find`, `find_index`, `has`, `reject`, `squish`. There is **no `flatten` filter** and no `pluralize`.

An unknown filter name renders **blank with no error text in the page**, because templates run with strict filters. If a filtered value is empty, check the filter name here before investigating the data.

Two failure conventions run through this file:
- The collection and Map filters mostly **swallow errors and return nil**, which renders blank.
- `set_key`, `unset_key`, `collect_keys` and `rename_keys` **raise** instead, printing `Liquid error` into the page.

`insert`, `push`, `unshift`, `pop` and `shift` **mutate** the array they are given. Two examples in a row that operate on the same variable will not behave independently.

## Table of Contents

- [Math Filters](#math-filters)
- [String Filters](#string-filters)
- [Array/List Filters](#arraylist-filters)
- [Utility Filters](#utility-filters)
- [DateTime Filters](#datetime-filters)
- [Number Formatting Filters](#number-formatting-filters)
- [Text Filters](#text-filters)
- [Collection Filters](#collection-filters)
- [Map/Object Filters](#mapobject-filters)
- [URL Filters](#url-filters)
- [Video Filters](#video-filters)
- [Theme Filters](#theme-filters)
- [Record Filters](#record-filters)
- [Product Content Filters](#product-content-filters)

---

## Math Filters

### `abs`

Returns the absolute value of a number.

```liquid
{{ -17 | abs }}
<!-- Output: 17 -->

{{ 4 | abs }}
<!-- Output: 4 -->

{{ "-19.86" | abs }}
<!-- Output: 19.86 -->
```

### `at_least`

Limits a number to a minimum value. Returns the input or the minimum, whichever is greater.

```liquid
{{ 4 | at_least: 5 }}
<!-- Output: 5 -->

{{ 4 | at_least: 3 }}
<!-- Output: 4 -->
```

### `at_most`

Limits a number to a maximum value. Returns the input or the maximum, whichever is smaller.

```liquid
{{ 4 | at_most: 5 }}
<!-- Output: 4 -->

{{ 4 | at_most: 3 }}
<!-- Output: 3 -->
```

### `ceil`

Rounds a number up to the nearest whole number. Converts string input to number first.

```liquid
{{ 1.2 | ceil }}
<!-- Output: 2 -->

{{ 2.0 | ceil }}
<!-- Output: 2 -->

{{ 183.357 | ceil }}
<!-- Output: 184 -->

{{ "3.5" | ceil }}
<!-- Output: 4 -->
```

### `floor`

Rounds a number down to the nearest whole number.

```liquid
{{ 1.2 | floor }}
<!-- Output: 1 -->

{{ 2.0 | floor }}
<!-- Output: 2 -->

{{ 183.357 | floor }}
<!-- Output: 183 -->
```

### `round`

Rounds a number to the nearest integer, or to the specified number of decimal places.

```liquid
{{ 1.2 | round }}
<!-- Output: 1 -->

{{ 2.7 | round }}
<!-- Output: 3 -->

{{ 183.357 | round: 2 }}
<!-- Output: 183.36 -->
```

### `plus`

Adds a number to another number.

```liquid
{{ 4 | plus: 2 }}
<!-- Output: 6 -->

{{ 183.357 | plus: 12 }}
<!-- Output: 195.357 -->
```

### `minus`

Subtracts a number from another number.

```liquid
{{ 4 | minus: 2 }}
<!-- Output: 2 -->

{{ 183.357 | minus: 12 }}
<!-- Output: 171.357 -->
```

### `times`

Multiplies a number by another number.

```liquid
{{ 3 | times: 2 }}
<!-- Output: 6 -->

{{ 183.357 | times: 12 }}
<!-- Output: 2200.284 -->
```

### `divided_by`

Divides a number by another number. **Important:** Integer division with an integer divisor rounds down. Use a float divisor for decimal results.

```liquid
{{ 16 | divided_by: 4 }}
<!-- Output: 4 -->

{{ 5 | divided_by: 3 }}
<!-- Output: 1 (integer division rounds down) -->

{{ 20 | divided_by: 7.0 }}
<!-- Output: 2.857142857142857 (float division) -->

{% assign a_float = 7 | times: 1.0 %}
{{ 20 | divided_by: a_float }}
<!-- Output: 2.857142857142857 -->
```

### `modulo`

Returns the remainder of dividing one number by another.

```liquid
{{ 3 | modulo: 2 }}
<!-- Output: 1 -->

{{ 24 | modulo: 7 }}
<!-- Output: 3 -->

{{ 183.357 | modulo: 12 }}
<!-- Output: 3.357 -->
```

---

## String Filters

### `append`

Adds the specified string to the end of another string.

```liquid
{{ "/my/fancy/url" | append: ".html" }}
<!-- Output: /my/fancy/url.html -->

{% assign filename = "/index.html" %}
{{ "website.com" | append: filename }}
<!-- Output: website.com/index.html -->
```

### `prepend`

Adds the specified string to the beginning of another string.

```liquid
{{ "apples, oranges, and bananas" | prepend: "Some fruit: " }}
<!-- Output: Some fruit: apples, oranges, and bananas -->
```

### `capitalize`

Makes the first character uppercase and the rest lowercase.

```liquid
{{ "title" | capitalize }}
<!-- Output: Title -->

{{ "my GREAT title" | capitalize }}
<!-- Output: My great title -->
```

### `downcase`

Converts all characters to lowercase.

```liquid
{{ "Han Solo" | downcase }}
<!-- Output: han solo -->
```

### `upcase`

Converts all characters to uppercase.

```liquid
{{ "title" | upcase }}
<!-- Output: TITLE -->
```

### `strip`

Removes whitespace (spaces, tabs, newlines) from both sides of a string.

```liquid
{{ "          Who watches the watchers?          " | strip }}
<!-- Output: Who watches the watchers? -->
```

### `lstrip`

Removes whitespace from the left (beginning) of a string.

```liquid
{{ "          Who watches the watchers?          " | lstrip }}
<!-- Output: Who watches the watchers?           -->
```

### `rstrip`

Removes whitespace from the right (end) of a string.

```liquid
{{ "          Who watches the watchers?          " | rstrip }}
<!-- Output:           Who watches the watchers? -->
```

### `strip_html`

Removes all HTML tags from a string.

```liquid
{{ "The quick brown <em>fox</em> jumps over the lazy <strong>dog</strong>" | strip_html }}
<!-- Output: The quick brown fox jumps over the lazy dog -->
```

### `strip_newlines`

Removes newline characters from a string.

```liquid
{% capture string_with_newlines %}
Hello
World!
{% endcapture %}
{{ string_with_newlines | strip_newlines }}
<!-- Output: HelloWorld! -->
```

### `escape`

Escapes special characters for safe HTML output (converts `&`, `<`, `>`, `"`, `'`).

```liquid
{{ "Click 'Add to Cart' when you're ready to purchase" | escape }}
<!-- Output: Click &#39;Add to Cart&#39; when you&#39;re ready to purchase -->
```

### `escape_once`

Escapes special characters without double-escaping already-escaped entities.

```liquid
{{ "1 < 2 & 3" | escape_once }}
<!-- Output: 1 &lt; 2 &amp; 3 -->

{{ "1 &lt; 2 &amp; 3" | escape_once }}
<!-- Output: 1 &lt; 2 &amp; 3 (no double escaping) -->
```

### `url_encode`

Converts URL-unsafe characters to percent-encoded characters. Spaces become `+`.

```liquid
{{ "john@example.com" | url_encode }}
<!-- Output: john%40example.com -->

{{ "About Us" | url_encode }}
<!-- Output: About+Us -->
```

### `url_decode`

Decodes a URL-encoded or percent-encoded string.

```liquid
{{ "%27Stop%21%27+said+Fred" | url_decode }}
<!-- Output: 'Stop!' said Fred -->
```

### `newline_to_br`

Inserts `<br />` before each newline character.

```liquid
{% capture string_with_newlines %}
Hello
there
{% endcapture %}
{{ string_with_newlines | newline_to_br }}
<!-- Output: <br />Hello<br />there<br /> -->
```

### `replace`

Replaces every occurrence of the first argument with the second.

```liquid
{{ "Baby shark do do do do" | replace: "do", "oi" }}
<!-- Output: Baby shark oi oi oi oi -->
```

### `replace_first`

Replaces only the first occurrence of the first argument with the second.

```liquid
{{ "Baby shark do do do do" | replace_first: "do", "oi" }}
<!-- Output: Baby shark oi do do do -->
```

### `remove`

Removes every occurrence of the specified substring.

```liquid
{{ "The rain in Spain falls mainly on the plain" | remove: "ain" }}
<!-- Output: The r in Sp falls mly on the pl -->
```

### `remove_first`

Removes only the first occurrence of the specified substring.

```liquid
{{ "The rain in Spain falls mainly on the plain" | remove_first: "ain" }}
<!-- Output: The r in Spain falls mainly on the plain -->
```

### `split`

Splits a string into an array using the argument as a separator.

```liquid
{% assign an_array = "earth, water, air, fire" | split: ", " %}
{% for element in an_array %}
  - {{ element }}
{% endfor %}
<!-- Output:
  - earth
  - water
  - air
  - fire
-->
```

### `truncate`

Shortens a string to the specified character count. Appends an ellipsis (`...`) by default, which is included in the count.

```liquid
{{ "Mary had a little lamb." | truncate: 15 }}
<!-- Output: Mary had a l... -->

{{ "Mary had a little lamb." | truncate: 15, "--" }}
<!-- Output: Mary had a li-- -->

{{ "Mary had a little lamb." | truncate: 15, "" }}
<!-- Output: Mary had a litt (no suffix) -->
```

### `truncatewords`

Shortens a string to the specified number of words. Appends an ellipsis by default.

```liquid
{{ "Mary had a little lamb." | truncatewords: 3 }}
<!-- Output: Mary had a... -->

{{ "Mary had a little lamb." | truncatewords: 3, "--" }}
<!-- Output: Mary had a-- -->

{{ "Mary had a little lamb." | truncatewords: 3, "" }}
<!-- Output: Mary had a -->
```

### `slice`

Returns a substring (for strings) or subarray (for arrays) starting at the given index. An optional second argument specifies the length. Negative indices count from the end.

```liquid
{{ "Earthquake" | slice: 0 }}
<!-- Output: E -->

{{ "Earthquake" | slice: 2, 5 }}
<!-- Output: rthqu -->

{{ "Earthquake" | slice: -3, 2 }}
<!-- Output: ak -->
```

### `size`

Returns the character count of a string or the item count of an array.

```liquid
{{ "Mary had a little lamb." | size }}
<!-- Output: 23 -->

{% assign an_array = "earth,water,air,fire" | split: "," %}
{{ an_array | size }}
<!-- Output: 4 -->
```

---

## Array/List Filters

### `join`

Combines array items into a string using the argument as separator.

```liquid
{% assign an_array = "scissors,paper,rock" | split: "," %}
{{ an_array | join: " beats " }}
<!-- Output: scissors beats paper beats rock -->
```

### `first`

Returns the first item of an array.

```liquid
{{ "Mary had a little lamb." | split: " " | first }}
<!-- Output: Mary -->

{% assign an_array = "earth,water,air,fire" | split: "," %}
{{ an_array | first }}
<!-- Output: earth -->
```

### `last`

Returns the last item of an array.

```liquid
{% assign an_array = "earth,water,air,fire" | split: "," %}
{{ an_array | last }}
<!-- Output: fire -->
```

### `concat`

Concatenates two arrays together into one.

```liquid
{% assign fruits = "apples,oranges,peaches" | split: "," %}
{% assign vegetables = "carrots,turnips,potatoes" | split: "," %}
{% assign everything = fruits | concat: vegetables %}
{{ everything | join: ", " }}
<!-- Output: apples, oranges, peaches, carrots, turnips, potatoes -->
```

### `map`

Creates an array by extracting a named property from each item.

```liquid
{% assign pages = '[{"title":"Home"},{"title":"About"},{"title":"Privacy"}]' | deserialize %}
{% assign titles = pages | map: "title" %}
{{ titles | join: ", " }}
<!-- Output: Home, About, Privacy -->
```

### `where`

Filters an array to only items with a matching property value. Without a value argument, filters to items where the property is truthy.

```liquid
{% assign articles = '[
  {"title":"Support","category":"help","published":true},
  {"title":"Stock News","category":"finance","published":true},
  {"title":"FAQs","category":"help","published":true},
  {"title":"About Us","category":"other"},
  {"title":"Troubleshooting","category":"help"}
]' | deserialize %}

{% assign help = articles | where: "category", "help" %}
{% for a in help %}{{ a.title }}, {% endfor %}
<!-- Output: Support, FAQs, Troubleshooting, -->

{% assign published = articles | where: "published" %}
{% for a in published %}{{ a.title }}, {% endfor %}
<!-- Output: Support, Stock News, FAQs, -->
```

### `sort`

Sorts items in case-sensitive order. Optionally sort by a property.

```liquid
{% assign an_array = "earth,Water,air,fire" | split: "," %}
{{ an_array | sort | join: ", " }}
<!-- Output: Water, air, earth, fire (uppercase sorts first) -->

{% assign pages = '[{"title":"Home"},{"title":"About"},{"title":"Privacy"}]' | deserialize %}
{% assign sorted = pages | sort: "title" %}
{% for p in sorted %}{{ p.title }}, {% endfor %}
<!-- Output: About, Home, Privacy, -->
```

### `sort_natural`

Sorts items in case-insensitive order.

```liquid
{% assign an_array = "earth,Water,air,fire" | split: "," %}
{{ an_array | sort_natural | join: ", " }}
<!-- Output: air, earth, fire, Water -->
```

### `reverse`

Reverses the order of items in an array. Cannot reverse a string directly.

```liquid
{% assign an_array = "earth,water,air,fire" | split: "," %}
{{ an_array | reverse | join: ", " }}
<!-- Output: fire, air, water, earth -->

{{ "Mary had a little lamb." | split: "" | reverse | join: "" }}
<!-- Output: .bmal elttil a dah yraM -->
```

### `uniq`

Removes duplicate items from an array.

```liquid
{% assign an_array = "ants,bugs,bees,bugs,ants" | split: "," %}
{{ an_array | uniq | join: ", " }}
<!-- Output: ants, bugs, bees -->
```

### `compact`

Removes nil/null values from an array.

```liquid
{% assign categories = "Geography,Entertainment,,History,Art,,Science" | split: "," %}
{% assign compacted = categories | compact %}
{{ compacted | join: ", " }}
<!-- Output: Geography, Entertainment, History, Art, Science -->
```

### `sum`

Sums all numeric items in an array, or sums a specific property from an array of objects.

```liquid
{% assign numbers = "1,2,3,4" | split: "," %}
{{ numbers | sum }}
<!-- Output: 10 -->

{% assign books = '[{"title":"Kid book","pages":10},{"title":"Adult book","pages":200}]' | deserialize %}
{{ books | sum: "pages" }}
<!-- Output: 210 -->
```

---

## Utility Filters

### `default`

Returns the default value if the input is nil, false, or empty. The `allow_false` option lets `false` pass through instead of being replaced.

```liquid
{% assign quantity = nil %}
{{ quantity | default: 5 }}
<!-- Output: 5 -->

{% assign price = 4.99 %}
{{ price | default: 2.99 }}
<!-- Output: 4.99 (already has value) -->

{% assign text = "" %}
{{ text | default: "No description" }}
<!-- Output: No description (empty string treated as blank) -->

{% assign hide_price = false %}
{{ hide_price | default: true }}
<!-- Output: true (false replaced by default) -->

{{ hide_price | default: true, allow_false: true }}
<!-- Output: false (false preserved with allow_false) -->
```

---

## DateTime Filters

StoreConnect date/time filters with full timezone support.

### `datetime`

Converts a date/time string to a valid ISO8601 timestamp with optional timezone conversion.

```liquid
{{ "2021-02-01 09:00" | datetime }}
<!-- Output: 2021-02-01T09:00:00Z -->

{{ "2021-06-01T09:00:00+10:00" | datetime }}
<!-- Output: 2021-05-31T23:00:00Z (converted to UTC) -->

{{ "2021-06-01T09:00:00+10:00" | datetime, timezone: "Pacific/Auckland" }}
<!-- Output: 2021-06-01T11:00:00+12:00 -->

{{ "2021-02-01 09:00" | datetime, timezone: "Australia/Sydney" }}
<!-- Output: 2021-02-01T09:00:00+11:00 (daylight savings applied) -->
```

### `now`

Returns the current date and time for the given timezone as an ISO8601 timestamp. An invalid timezone name doesn't raise — the filter renders the literal string `Invalid Timezone: <name>` instead (same for `today` and `datetime`).

```liquid
{{ "Australia/Sydney" | now }}
<!-- Output: 2024-07-01T09:00:00+10:00 -->

{{ "America/New_York" | now }}
<!-- Output: 2024-06-30T19:00:00-04:00 -->
```

### `today`

Returns the current date for the given timezone.

```liquid
{{ "Australia/Sydney" | today }}
<!-- Output: 2024-07-01 -->

{{ "UTC" | today }}
<!-- Output: 2024-06-30 -->
```

### `time_ago`

Returns a human-readable relative time string. Works for both past and future dates.

```liquid
{{ "2024-07-01T09:00:43Z" | time_ago }}
<!-- Output: about 10 hours -->

{{ "2024-09-01T09:00:00" | time_ago }}
<!-- Output: 2 months (future dates also work) -->
```

### `time_duration`

Returns a human-readable duration string from a number of seconds.

```liquid
{{ 10 | time_duration }}
<!-- Output: less than 20 seconds -->

{{ 50 | time_duration }}
<!-- Output: less than a minute -->

{{ 3600 | time_duration }}
<!-- Output: about 1 hour -->

{{ 18000 | time_duration }}
<!-- Output: about 5 hours -->

{{ 259200 | time_duration }}
<!-- Output: 3 days -->
```

### `date` (Enhanced)

Formats a date/time using strftime syntax. Enhanced with timezone support. Accepts date strings, `"now"`, `"today"`, or Unix timestamps.

```liquid
{{ "2021-07-01T09:00:00Z" | date: "%a, %b %d, %y" }}
<!-- Output: Thu, Jul 01, 21 -->

{{ "2021-07-01T09:00:00Z" | date: "%Y" }}
<!-- Output: 2021 -->

{{ "March 14, 2016" | date: "%b %d, %y" }}
<!-- Output: Mar 14, 16 -->

{{ "now" | date: "%Y-%m-%d %H:%M" }}
<!-- Output: 2024-06-30 23:00 (current date/time) -->

{{ "2021-07-01T09:00:00Z" | date: "%Y-%m-%d %H:%M", timezone: "Australia/Sydney" }}
<!-- Output: 2021-07-01 19:00 -->
```

**Common format tokens:**

| Token | Description | Example |
|-------|-------------|---------|
| `%Y` | Year with century | 2024 |
| `%m` | Month (01-12) | 07 |
| `%-m` | Month without padding | 7 |
| `%d` | Day of month (01-31) | 01 |
| `%-d` | Day without padding | 1 |
| `%H` | Hour 24h (00-23) | 14 |
| `%M` | Minute (00-59) | 30 |
| `%S` | Second (00-59) | 00 |
| `%a` | Abbreviated day name | Thu |
| `%A` | Full day name | Thursday |
| `%b` | Abbreviated month name | Jul |
| `%B` | Full month name | July |

### `date_add`

Adds units of time to a date and returns an ISO8601 timestamp in UTC. Accepts negative values for subtraction.

```liquid
{{ "2021-03-01T09:00:00" | date_add: days: 5 }}
<!-- Output: 2021-03-06T09:00:00Z -->

{{ "2021-03-01T09:00:00" | date_add: minutes: 5 }}
<!-- Output: 2021-03-01T09:05:00Z -->

{{ "2021-03-01T09:00:00" | date_add: weeks: 5 }}
<!-- Output: 2021-04-05T09:00:00Z -->

{{ "2021-03-01T09:00:00+10:00" | date_add: days: 5 }}
<!-- Output: 2021-03-05T23:00:00Z (converts to UTC) -->

{{ "2021-03-01T09:00:00" | date_add: days: -5 }}
<!-- Output: 2021-02-24T09:00:00Z (negative values subtract) -->
```

**Options:** `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `timezone`

---

## Number Formatting Filters

### `money`

Formats a number as currency. Strips `.00` cents by default. The `compact` option controls trailing zero behavior. The `unit` option changes the currency symbol.

```liquid
{{ 12.76 | money }}
<!-- Output: $12.76 -->

{{ 12.70 | money }}
<!-- Output: $12.70 -->

{{ 12.00 | money }}
<!-- Output: $12 (cents removed when .00) -->

{{ 12.76 | money, compact: true }}
<!-- Output: $12.76 -->

{{ 12.70 | money, compact: true }}
<!-- Output: $12.7 (trailing zero removed) -->

{{ 99.00 | money, compact: true }}
<!-- Output: $99 (all decimals removed) -->

{{ 12.70 | money, compact: false }}
<!-- Output: $12.70 (zero retained) -->

{{ 12.95 | money, unit: '€' }}
<!-- Output: €12.95 -->

{{ 12.95 | money, unit: '' }}
<!-- Output: 12.95 (no currency symbol) -->
```

### `points`

Formats a number as loyalty points with comma separators and "pts" suffix.

```liquid
{{ 12 | points }}
<!-- Output: 12 pts -->

{{ 1200 | points }}
<!-- Output: 1,200 pts -->

{{ 1200000 | points }}
<!-- Output: 1,200,000 pts -->
```

### `number`

Formats a number with locale-aware options. `compact` removes insignificant zeros (defaults to true unless `precision` is specified).

```liquid
{{ 12 | number }}
<!-- Output: 12 -->

{{ 12.768 | number }}
<!-- Output: 12.768 -->

{{ 12.7689 | number }}
<!-- Output: 12.769 (rounded to 3 decimal places by default) -->

{{ 12.70 | number, compact: true }}
<!-- Output: 12.7 (trailing zero removed) -->

{{ 99.00 | number, compact: true }}
<!-- Output: 99 -->

{{ 99.100 | number, compact: false }}
<!-- Output: 99.100 -->

{{ 12000 | number, delimiter: "," }}
<!-- Output: 12,000 -->

{{ 12.76 | number, separator: "," }}
<!-- Output: 12,76 -->

{{ 12 | number, precision: 3 }}
<!-- Output: 12.000 -->

{{ 12.7682 | number, precision: 3 }}
<!-- Output: 12.768 -->

{{ 99.1010 | number, precision: 6, compact: true }}
<!-- Output: 99.101 -->
```

**Options:** `compact` (boolean — strips insignificant trailing zeros), `delimiter` (thousands separator), `separator` (decimal separator), `precision` (decimal places). Options pass straight through to the underlying number formatter, so `significant`, `round_mode` and `format` also work. When `precision` is omitted, `compact` defaults to true.

---

## Text Filters

StoreConnect text processing extensions.

### `j`

JavaScript escape. Escapes carriage returns, single quotes, and double quotes for use in JavaScript string literals.

```liquid
{{ "Click 'Add to Cart' when you're ready to purchase" | j }}
<!-- Output: Click \'Add to Cart\' when you\'re ready to purchase -->

<script>
  var message = '{{ user_message | j }}';
</script>
```

### `unescape`

Unescapes HTML-escaped text back to the original characters.

```liquid
{{ "Click &#39;Add to Cart&#39; when you&#39;re ready to purchase" | unescape }}
<!-- Output: Click 'Add to Cart' when you're ready to purchase -->

{{ "&lt;p&gt;Hello&lt;/p&gt;" | unescape }}
<!-- Output: <p>Hello</p> -->
```

### `parameterize`

Converts a string to a URL-friendly slug format (lowercase, hyphens, no special characters).

```liquid
{{ "On Sale" | parameterize }}
<!-- Output: on-sale -->

{{ "The rain in Spain falls mainly on the plain" | parameterize }}
<!-- Output: the-rain-in-spain-falls-mainly-on-the-plain -->

{{ "John O'Connor" | parameterize }}
<!-- Output: john-o-connor -->

{{ "About Us & Contact" | parameterize }}
<!-- Output: about-us-contact -->
```

### `deserialize`

Parses a JSON **or XML** string into a Liquid object (Map or List) that can be iterated and accessed. XML is detected by a leading `<`.

```liquid
{% assign json = '[{"id":1,"name":"Dog"},{"id":2,"name":"Cat"}]' %}
{{ json | deserialize | pluck: "name" | join: " & " }}
<!-- Output: Dog & Cat -->

{% assign data = '{"title":"Hello","count":42}' | deserialize %}
{{ data.title }} - {{ data.count }}
<!-- Output: Hello - 42 -->

```

A parse failure returns **nil**, and an input over 1 MB also returns nil, so guard the result with `!= blank` before reading values. Use this only with data your theme expects; never deserialize a raw request parameter and act on its contents.

The result is a Map or List. Unsupported collection operations — such as `keys`
on a Map or `sample` on a paginated collection — return an empty result rather
than erroring.

### `markdown`

Converts a Markdown string to sanitized HTML using GitHub-Flavored Markdown. Available on current platform versions (older stores may not have it — the drops' `*_content` accessors remain the standard way to output markdown-sourced record content).

```liquid
{{ "This is **bold**, _italic_, and `code`" | markdown }}
<!-- Output: <p>This is <strong>bold</strong>, <em>italic</em>, and <code>code</code></p> -->

{{ "# Heading 1" | markdown }}
<!-- Output: <h1 id="heading-1">Heading 1</h1> (headings get auto-generated ids) -->
```

The output is passed through an HTML sanitizer with a fixed allow-list of tags and attributes, and returned as safe HTML. Script tags, event-handler attributes, and `javascript:` / `data:` URLs are stripped. Blank input returns an empty string.

Use `markdown` only on a value that is *meant* to hold Markdown. Record rich-text fields already render through their `*_content` accessors — running one of those through `markdown` a second time mangles the output.

### `hmac`

Returns an HMAC of a string, for signing a value that a trusted external service will verify.

```liquid
{%- assign signature = payload
  | hmac: store_variables["<approved-signing-key>"],
          algorithm: "<documented-algorithm>",
          digest: "<documented-format>" -%}
```

Use only the algorithm and output format required by the approved integration's
current documentation, and verify the result is non-blank.

The established Store Variable integration pattern keeps the configured value
out of the template source. Never render or log it. Sign only the minimum
approved payload, and never expose a signature that grants broader access than
that payload requires.

### `encrypt` / `decrypt`

Transforms a non-sensitive value into an opaque form and restores it with the
same explicit salt. This is obfuscation, not authorization.

```liquid
{%- assign protected_state = display_state | encrypt: salt: "display-state" -%}
…
{%- assign display_state = protected_state | decrypt: salt: "display-state" -%}
```

**Options:** `salt` — supply the same non-secret, purpose-specific value to both
filters.

Always re-check that the current customer is entitled to anything the restored
value identifies. Do not use this for credentials, customer data, payment data,
or a value you would otherwise refuse to send to the browser.

---

## Collection Filters

Advanced operations on arrays, collections, and objects. These extend standard Liquid with powerful data manipulation.

### `group_by`

Groups an array of objects by a property. Returns an array of group objects, each with `name` (the property value), `items` (the matching items), and `size` (count).

```liquid
{% assign products = '[
  {"name":"Fridgetastic 3000","type":"whitegoods"},
  {"name":"Coldinator 500","type":"whitegoods"},
  {"name":"Geronimo 9000","type":"computers"},
  {"name":"Y2K Amaze","type":"computers"}
]' | deserialize %}

{% assign list = products | group_by: "type" %}
{% for group in list %}
  <h3>{{ group.name }} ({{ group.size }} items)</h3>
  {% for item in group.items %}
    <p>{{ item.name }}</p>
  {% endfor %}
{% endfor %}
<!-- Output:
  <h3>whitegoods (2 items)</h3>
  <p>Fridgetastic 3000</p>
  <p>Coldinator 500</p>
  <h3>computers (2 items)</h3>
  <p>Geronimo 9000</p>
  <p>Y2K Amaze</p>
-->
```

### `pluck`

Extracts values for one or more properties from an array of objects.

```liquid
{% assign products = '[
  {"name":"Widget","type":"electronics"},
  {"name":"Gadget","type":"electronics"}
]' | deserialize %}

{{ products | pluck: "name" | json }}
<!-- Output: ["Widget","Gadget"] -->

{{ products | pluck: "name", "type" | json }}
<!-- Output: [["Widget","electronics"],["Gadget","electronics"]] -->
```

### `sample`

Returns a random sample of the specified size from a collection. Order is random. **The count argument is required** — bare `| sample` errors. Chain `| first` to pick a single random item.

```liquid
{% assign items = "1,2,3,4,5,6,7,8,9" | split: "," %}
{{ items | sample: 2 | join: ", " }}
<!-- Output: 4, 8 (random - results vary) -->
```

### `try`

Safely accesses a property or method on a Drop or Map. Returns **nil** when it is not there, instead of leaving a blank from a strict-mode failure. Works for drop methods as well as keys — `{{ all_content_blocks['promo'] | try: "render" }}` is the standard way to render an optional content block.

Test the result with `!= blank`, not `== ""`: the return value is nil, so `{% if x | try: "k" == "" %}` is false while `!= blank` behaves as expected.

Use `try` only where the attribute is genuinely optional. On a required attribute it converts a diagnosable typo into a silent blank.

```liquid
{% assign error_1 = '{"message":"Something is wrong"}' | deserialize %}
{% assign error_2 = '{"message":"Oh noes!","code":"RED"}' | deserialize %}

{{ error_1 | try: "code" }}
<!-- Output: (empty string - property doesn't exist) -->

{{ error_2 | try: "code" }}
<!-- Output: RED -->
```

### `paginate` (filter)

Fetches the **first page** of a paginated collection at the given size. This is the cheap way to render a fixed small number of items with no pagination UI.

```liquid
{% assign featured = all_products | paginate: 4 %}
{% for product in featured %}
  {% render "products/card", product: product %}
{% endfor %}
```

Only works on a paginated collection — every `all_*` global, `current_search.results.*`, and any Drop attribute marked Paginated. On a plain array (including anything from `split`) it returns **nil**, which renders blank.

### `depaginate`

Turns off the protective pagination on a paginated collection so whole-collection filters such as `where` and `sort` can be applied. It costs a count query plus **one unbounded fetch of every matching row**.

```liquid
{%- comment -%} Acceptable: a variant set is inherently small {%- endcomment -%}
{% assign all_variants = product.variants | depaginate %}

{%- comment -%} Dangerous on a real catalog: loads every product {%- endcomment -%}
{% assign everything = all_products | depaginate %}
```

Prefer `| paginate: N` when you only need the first N. Returns nil on anything that is not a paginated collection.

### `json` / `serialize`

Converts any object to a JSON string. Both filter names are identical. On a serialization failure it returns an empty string rather than raising, so a blank `{{ x | json }}` means the object could not be serialized.

```liquid
{% assign pets = '[{"id":1,"name":"Dog"},{"id":2,"name":"Cat"}]' | deserialize %}
{{ pets | json }}
<!-- Output: [{"id":1,"name":"Dog"},{"id":2,"name":"Cat"}] -->

{{ pets | serialize }}
<!-- Output: [{"id":1,"name":"Dog"},{"id":2,"name":"Cat"}] -->
```

### `contains` (filter)

Returns true if the array contains the specified item.

```liquid
{% assign numbers = "10,9,8,7,6,5,4,3,2,1" | split: "," %}
{{ numbers | contains: "5" }}
<!-- Output: true -->

{{ numbers | contains: "99" }}
<!-- Output: false -->
```

### `only`

Returns items where the specified property equals one of the given values. Without values, returns items where the property is truthy.

```liquid
{% assign products = '[
  {"name":"Fridgetastic","type":"whitegoods","new":false},
  {"name":"Coldinator","type":"whitegoods","new":false},
  {"name":"Geronimo","type":"computers","new":false},
  {"name":"Y2K Amaze","type":"computers","new":true},
  {"name":"Elephant","type":"animals","new":false}
]' | deserialize %}

{{ products | only: "type", "whitegoods" | pluck: "name" | join: ", " }}
<!-- Output: Fridgetastic, Coldinator -->

{{ products | only: "type", "whitegoods", "computers" | pluck: "name" | join: ", " }}
<!-- Output: Fridgetastic, Coldinator, Geronimo, Y2K Amaze -->

{{ products | only: "new" | pluck: "name" | join: ", " }}
<!-- Output: Y2K Amaze (only truthy values) -->
```

### `except`

Returns items where the specified property does NOT equal the given value. Without a value, excludes items where the property is truthy. Can be chained.

```liquid
{{ products | except: "type", "whitegoods" | pluck: "name" | join: ", " }}
<!-- Output: Geronimo, Y2K Amaze, Elephant -->

{{ products | except: "new" | pluck: "name" | join: ", " }}
<!-- Output: Fridgetastic, Coldinator, Geronimo, Elephant -->

{{ products | except: "type", "whitegoods" | except: "type", "computers" | pluck: "name" | join: ", " }}
<!-- Output: Elephant (chaining multiple except filters) -->
```

### `push`

Adds an item to the end of an array.

```liquid
{% assign my_list = "1,2,3,4,5" | split: "," %}
{{ my_list | push: "99" | join: ", " }}
<!-- Output: 1, 2, 3, 4, 5, 99 -->
```

### `unshift`

Adds an item to the beginning of an array.

```liquid
{% assign my_list = "1,2,3,4,5" | split: "," %}
{{ my_list | unshift: "99" | join: ", " }}
<!-- Output: 99, 1, 2, 3, 4, 5 -->
```

### `pop`

Removes and returns the last item from an array. Modifies the original array.

```liquid
{% assign my_list = "1,2,3,4,5" | split: "," %}
Removed: {{ my_list | pop }}
Remaining: {{ my_list | join: ", " }}
<!-- Output: Removed: 5, Remaining: 1, 2, 3, 4 -->
```

### `shift`

Removes and returns the first item from an array. Modifies the original array.

```liquid
{% assign my_list = "1,2,3,4,5" | split: "," %}
Removed: {{ my_list | shift }}
Remaining: {{ my_list | join: ", " }}
<!-- Output: Removed: 1, Remaining: 2, 3, 4, 5 -->
```

### `insert`

Inserts an item at the specified index. Supports negative indices.

```liquid
{% assign my_list = "1,2,3,4,5" | split: "," %}
{{ my_list | insert: "99", 2 | join: ", " }}
<!-- Output: 1, 2, 99, 3, 4, 5 -->
```

`insert` **mutates** `my_list`, so a second `insert` on the same variable operates on the already-modified array. Re-assign a fresh copy if you need independent results. A negative index counts from the end.

### `intersection`

Returns items present in both arrays.

```liquid
{% assign list1 = "1,2,3,4,5" | split: "," %}
{% assign list2 = "3,4,5,6,7" | split: "," %}
{{ list1 | intersection: list2 | join: ", " }}
<!-- Output: 3, 4, 5 -->
```

### `union`

Returns all unique items from both arrays combined.

```liquid
{% assign list1 = "1,2,3,4,5" | split: "," %}
{% assign list2 = "3,4,5,6,7" | split: "," %}
{{ list1 | union: list2 | join: ", " }}
<!-- Output: 1, 2, 3, 4, 5, 6, 7 -->
```

### `difference`

Returns items in the first array that are not in the second.

```liquid
{% assign list1 = "1,2,3,4,5" | split: "," %}
{% assign list2 = "3,4,5,6,7" | split: "," %}
{{ list1 | difference: list2 | join: ", " }}
<!-- Output: 1, 2 -->
```

### `match`

Returns items (from an array) or characters (from a string) matching a regex pattern. Includes capture groups for string matches.

```liquid
{% assign list = "apple,banana,cherry,date" | split: "," %}
{{ list | match: "a" | join: ", " }}
<!-- Output: apple, banana, date -->

{{ list | match: "a.*e" | join: ", " }}
<!-- Output: apple, date -->

{{ "metamorphosis" | match: "a.*s" | join: ", " }}
<!-- Output: amorphosis -->

{{ "metamorphosis" | match: "(a)(m)(o)" | join: ", " }}
<!-- Output: amo, a, m, o (includes capture groups) -->
```

---

## Map/Object Filters

### `keys`

Returns an array of keys from a map/hash.

```liquid
{% assign my_map = '{"name":"Fridgetastic","type":"whitegoods"}' | deserialize %}
{{ my_map | keys | join: ", " }}
<!-- Output: name, type -->
```

### `merge`

Merges two maps together. Values from the second map override matching keys in the first.

```liquid
{% assign map1 = '{"a":1,"b":2}' | deserialize %}
{% assign map2 = '{"b":3,"c":4}' | deserialize %}
{{ map1 | merge: map2 | json }}
<!-- Output: {"a":1,"b":3,"c":4} -->
```

### `set_key`

Sets a key-value pair on a map. Adds or updates.

> Unlike the collection filters, the four key filters **raise** rather than returning nil.
> `set_key` needs a Map, `unset_key` needs something deletable, `collect_keys` and
> `rename_keys` need a Map or a List of Maps, and `rename_keys` needs an even number of
> arguments. Anything else prints `Liquid error` into the page.

```liquid
{% assign map = '{"a":1,"b":2}' | deserialize %}
{{ map | set_key: "c", 3 | json }}
<!-- Output: {"a":1,"b":2,"c":3} -->

{{ map | set_key: "b", 99 | json }}
<!-- Output: {"a":1,"b":99} -->
```

### `unset_key`

Removes one or more keys from a map.

```liquid
{% assign map = '{"a":1,"b":2,"c":3}' | deserialize %}
{{ map | unset_key: "b" | json }}
<!-- Output: {"a":1,"c":3} -->

{{ map | unset_key: "b", "c" | json }}
<!-- Output: {"a":1} -->

{{ map | unset_key: "d" | json }}
<!-- Output: {"a":1,"b":2,"c":3} (no change if key doesn't exist) -->
```

### `collect_keys`

Extracts specific keys from an array of maps, returning an array of maps with only those keys.

```liquid
{% assign data = '[
  {"a":1,"b":2,"c":3},
  {"a":3,"b":4,"c":5},
  {"a":5,"b":6,"c":7}
]' | deserialize %}

{{ data | collect_keys: "a" | json }}
<!-- Output: [{"a":1},{"a":3},{"a":5}] -->

{{ data | collect_keys: "a", "b" | json }}
<!-- Output: [{"a":1,"b":2},{"a":3,"b":4},{"a":5,"b":6}] -->
```

### `rename_keys`

Renames keys in a map or array of maps. Arguments are pairs of old_key, new_key.

```liquid
{% assign map = '{"a":1,"b":2,"c":3}' | deserialize %}
{{ map | rename_keys: "a", "alpha" | json }}
<!-- Output: {"alpha":1,"b":2,"c":3} -->

{{ map | rename_keys: "a", "alpha", "b", "beta" | json }}
<!-- Output: {"alpha":1,"beta":2,"c":3} -->

{% assign array = '[{"a":1,"b":2}]' | deserialize %}
{{ array | rename_keys: "a", "alpha", "b", "beta" | json }}
<!-- Output: [{"alpha":1,"beta":2}] (works on arrays of maps too) -->
```

---

## URL Filters

### `params`

Adds query parameters to a URL or path. Handles both URLs with and without existing query strings.

```liquid
{{ "/about-us" | params: foo: "bar" }}
<!-- Output: /about-us?foo=bar -->

{{ "/about-us?fizz=buzz" | params: foo: "bar" }}
<!-- Output: /about-us?fizz=buzz&foo=bar -->

{{ "http://example.com/about-us" | params: foo: "bar", fizz: "buzz" }}
<!-- Output: http://example.com/about-us?foo=bar&fizz=buzz -->
```

---

## Video Filters

### `youtube`

Returns HTML embed code for a YouTube video with a responsive iframe wrapper.

```liquid
{{ "12345-abcde" | youtube }}
<!-- Output: a responsive YouTube iframe wrapper -->

{{ "12345-abcde" | youtube, start_at: 927 }}
<!-- Output: ...?start=927... -->
```

### `vimeo`

Returns HTML embed code for a Vimeo video with a responsive iframe wrapper.

```liquid
{{ "12345-abcde" | vimeo }}
<!-- Output: <div class="responsive-iframe"><iframe src="https://player.vimeo.com/video/12345-abcde#t=0s" frameborder="0" allow="autoplay; fullscreen" allowfullscreen class="Video_embed vimeo"></iframe></div> -->

{{ "12345-abcde" | vimeo, start_at: 678 }}
<!-- Output: ...#t=678s... -->
```

---

## Theme Filters

### `t`

Translation/localization filter. Looks up a key in the theme's translation file (`translations/en.default.json`). Supports variable interpolation, with either `|  t: ` or `| t, ` as the separator.

Interpolation failure modes differ. Supply **no** variables and an expected `%{placeholder}` is left in the output. Supply *some* variables but omit one the string expects and it **raises** — `Liquid error` in the page. Extra variables the string does not use are ignored. So pass every placeholder a string needs, or none.

```liquid
{{ "welcome.title" | t }}
<!-- Output: Welcome (translated value) -->

{{ "products.general.cta" | t: product: product.name }}
<!-- Output: uses product name variable -->
```

Both argument separators work and both appear in the base theme — `| t: count: n` and `| t, count: n` are equivalent.

If a key is not found, returns: ``missing translation: `sc.locale.{key}` for locale: `{locale}` `` (key and locale wrapped in backticks).

Lookup order: theme `Locale_Translation` records (via `Theme_Locale`) are merged **over** the built-in base translations — a theme record with the same key overrides the platform default.

A key ending in `_html` is returned as HTML-safe (unescaped) — that is how the base theme ships markup inside translations (`checkout.gateways.afterpay.terms_html`, `checkout.gateways.latitude.description_html`). Any other key is escaped on output, so markup in a non-`_html` key renders as visible tags. Never put merchant- or customer-supplied content into an `_html` key.

#### Pluralization (`count:`)

**There is no `pluralize` filter in StoreConnect.** The Shopify-style `{{ n | pluralize: "item", "items" }}` does not exist. Pluralization happens inside `t`: pass `count:` and point the key at a *group* of nested sub-keys instead of a single string. Note this is the one variable with dual behavior — `count` selects the sub-key *and* remains available as `%{count}` for interpolation.

```liquid
{{ "cart.items.count" | t, count: current_cart.items.size }}
```

```json
{ "cart": { "items": { "count": {
  "zero":  "Your cart is empty",
  "one":   "1 item",
  "other": "%{count} items"
} } } }
```

Resolution order — the **first** matching sub-key that is present wins:

| Sub-key | Matches when |
|---|---|
| `zero` | `count == 0` |
| `one` | `count == 1` |
| `#N` | `count == N` exactly (`#2`, `#3`, …) |
| `N_M` | `count` falls within the inclusive range `N`–`M` (`2_10`) |
| `infinity` | `count` is infinite |
| `other` | fallback for everything else |

Only `one` and `other` are conventional; `zero`, `#N`, `N_M`, and `infinity` are StoreConnect additions, so don't assume a group written for another Liquid platform ports across. Because `zero` and `one` are only consulted when present, a group of just `other` is legal and always safe.

**Always include `other`.** If no sub-key matches, the lookup raises rather than degrading — a group of only `one` will break on `count: 5`.

**`#N` needs the `#`.** A final key segment that is purely numeric is treated as an *array index*, not a hash key, when flat keys are nested into the translation tree. `count.2` builds an array; `count.#2` builds the exact-count match you want. Range keys (`2_10`) are unaffected because `_` makes the segment non-numeric.

Worked examples from the base theme, which are the ones to copy:

```json
{ "products": { "pricing": { "timespan_week": { "count": {
  "one":   "week",
  "#2":    "fortnight",
  "other": "%{count} weeks"
} } } } }
```

```json
{ "accounts": { "product_approvals": { "shared": { "quantity": { "count": {
  "infinity": "Unlimited",
  "other":    "%{count}"
} } } } } }
```

```json
{ "accounts": { "shared": { "address_form": { "address_lines": { "count": {
  "#1": "Street address",
  "#2": "Suite",
  "#3": "Apartment",
  "#4": "Building Number",
  "other": "line %{count}"
} } } } } }
```

That last one is `#N` doing non-numeric work: driving per-index field labels off `forloop.index`, with a generic fallback past the fourth line.

```liquid
{%- assign field = form.fields["billing_address_lines"] %}
{%- for line in field.value %}
  <label for="{{ field.id }}_{{ forloop.index }}">
    {{ "accounts.shared.address_form.address_lines.count" | t, count: forloop.index }}
  </label>
{%- endfor %}
```

Convention: name the group key `count` (`accounts.profile.sections.orders.count`) so call sites read as `…orders.count" | t, count: n`. Every pluralized group in the base theme follows it.

Prefer this over branching in Liquid. Both of these are wrong — the first bloats the key set and hard-codes English grammar, the second is unmaintainable and breaks in any locale whose plural rules differ:

```liquid
{%- comment %} WRONG — two keys where one group belongs {% endcomment %}
{%- if n == 1 %}{{ "cart.one_item" | t }}{%- else %}{{ "cart.n_items" | t: count: n }}{%- endif %}

{%- comment %} WRONG — English grammar baked into the template {% endcomment %}
{{ n }} item{% if n != 1 %}s{% endif %}
```

### `asset_url`

Returns the URL for an asset registered in the current theme's asset map. A key that is not registered returns the literal string `unknown asset: <key>` rather than an empty value, so a broken `src` attribute containing that text tells you the key is wrong, not the file.

```liquid
<img src="{{ 'images/hero.jpg' | asset_url }}" alt="">
```

This is only for theme-registered assets. Merchant-uploaded images come from Media and Image Drops (`medium.url`, `image.medium_url`), and compiled theme resources come from `{% require %}` or `{% resource_path %}`.

---

## Record Filters

Filters for inspecting and converting StoreConnect records and Drops.

### `record_fields`

Returns the readable column names on an **untyped record** from a `{% query %}`. On a typed Drop it returns empty — pipe through `recordize` first.

```liquid
{% query 'Product2' as records, s_c__store__c: current_store.sfid %}
{% for record in records %}
  {{ record | record_fields | join: ", " }}
  <!-- Output: name, sfid, createddate, s_c__slug__c, ... -->
{% endfor %}

{%- comment -%} From a typed Drop {%- endcomment -%}
{{ current_product | recordize | record_fields | join: ", " }}
```

Debug use only. Never render this to a customer.

### `record_relationships`

Currently returns an empty list for every input. Do not rely on it.

### `record_name`

Returns the query object name of an untyped record, not the Drop name.

```liquid
{% query 'Product2' as records, s_c__store__c: current_store.sfid %}
{% for record in records %}{{ record | record_name }}{% endfor %}
<!-- Output: product2 -->
```

On a typed Drop it returns empty.

### `cast`

Converts values between types. **Only two primitive targets exist: `"number"` (via `to_i` — integers only) and `"string"`.** There is no `"integer"`, `"float"`, or `"boolean"` cast — those are treated as (nonexistent) drop names and return nil.

**Primitive type conversion:**

```liquid
{{ "123" | cast: "number" }}
<!-- Output: 123 -->

{{ 123 | cast: "string" }}
<!-- Output: 123 (as string) -->
```

**Record to Drop conversion (used with `{% query %}` results):** the argument is the Drop name (`"Product"`), not the Salesforce object API name. Matching is case-insensitive and tolerates a plural, so `'product'` also works, and the argument may be a variable. A record that is not of that type returns nil. An unrecognized Drop name returns nil **and reports an error**, so check the Console if a cast silently produces nothing. Always guard the result.

```liquid
{% query 'Product2' as product_records %}
{% for record in product_records %}
  {% assign product = record | cast: "Product" %}
  {% if product != blank %}{{ product.name }} - {{ product.pricing.price | money }}{% endif %}
{% endfor %}
```

### `recordize`

Converts a drop back to its underlying record representation. Not all drops can be converted.

```liquid
{% assign record = product_drop | recordize %}
{{ record | record_fields | join: ", " }}
```

---

## Product Content Filters

Render product-associated content using built-in templates. These filters take a product drop and return rendered HTML.

### `show_traits`

Renders all product traits using a built-in template. If a variant product does not have its own trait category, it falls back to the master product's.

> Legacy. The source marks it as not supported going forward, and the shipped base theme does not use it or the `*_content_blocks` filters. Prefer iterating `product.trait_groups` and writing your own markup.

```liquid
{{ product | show_traits }}

{% for variant in product.variants %}
  <div class="variant-traits">
    {{ variant | show_traits }}
  </div>
{% endfor %}
```

### `render_content_blocks`

Renders **all** of a Drop's root content blocks. It takes no arguments — `{{ product | render_content_blocks: "downloads" }}` raises a wrong-number-of-arguments error. Use the type-specific filters below for a single type.

```liquid
{{ product | render_content_blocks }}
```

### `downloads_content_blocks`

Renders all downloads content blocks (PDFs, manuals, software). Alias: `render_downloads_content_blocks`

```liquid
{{ product | downloads_content_blocks }}
```

### `features_content_blocks`

Renders all features content blocks (key selling points, highlights). Alias: `render_features_content_blocks`

```liquid
{{ product | features_content_blocks }}
```

### `specifications_content_blocks`

Renders all specifications content blocks (technical specs, dimensions). Alias: `render_specifications_content_blocks`

```liquid
{{ product | specifications_content_blocks }}
```

### `support_content_blocks`

Renders all support content blocks (help info, contact details). Alias: `render_support_content_blocks`

```liquid
{{ product | support_content_blocks }}
```

### `warranty_content_blocks`

Renders all warranty content blocks (warranty terms, coverage). Alias: `render_warranty_content_blocks`

```liquid
{{ product | warranty_content_blocks }}
```
