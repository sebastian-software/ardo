# Share image font fixture

`ArdoTestSans.ttf` is a renamed, static weight-400 subset of Noto Sans SC,
licensed under the accompanying SIL Open Font License. It is test data only;
Ardo does not bundle a production font or download fonts during builds.

Source: https://github.com/google/fonts/tree/main/ofl/notosanssc
Original SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`

Created with fonttools 4.60.2: instantiate `wght=400`, retain U+0020–U+024F,
U+0370–U+04FE and the characters `中文日本語指南構築漢字你好世界画像`,
then rename the family to Ardo Test Sans. The subset deliberately covers the
four docs languages plus Greek/Cyrillic and the CJK failure checks. It is not
a general-purpose multilingual font.
