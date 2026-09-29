Add `toCsvRow(fields)` for order exports. It formats one CSV record per RFC 4180: a field that
contains a comma, a double quote, a carriage return, or a line feed is enclosed in double quotes,
with inner double quotes doubled; `null` and `undefined` become empty fields. The caller joins rows
with CRLF.
