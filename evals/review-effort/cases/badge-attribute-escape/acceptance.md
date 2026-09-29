Add `renderBadge({ label, title })`, which renders a status badge as an HTML string; `title`
defaults to `label`. Both values come from user input and the result is inserted into pages as
HTML, so no label or title may inject markup, attributes, or script.
