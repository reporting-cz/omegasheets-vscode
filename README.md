# OmegaSheets

This extension enables viewing and editing Excel workbooks and csv files.
It can open *.xlsx, *.xls, *.csv and *.tsv files. Files with extensions *.omega.csv or *.omega.tsv will open automatically in datagrid editor. Files with extension *.csv and *.tsv can be open in datagrid editor via "Open With..." command.

## Features

> :warning: Saving workbook with unsupported features will result in loss of those features in saved file and possible loss of data.

- cell styles and formats
- formulas evaluation with subset of basic functions
![Conditional styles](/assets/formulas.gif)

- conditional styles
![Conditional styles](/assets/conditional_styles.gif)
![Conditional styles](/assets/conditional_styles_2.gif)

- row and column outlines
![Outlines](/assets/outline.gif)
- autofill
- names ranges

- csv viewer/editor
![CSV](/assets/csv_options.gif)


## Extension Settings

This extension contributes the following settings:

* `omegasheets.csvDelimiter`: Specifies the delimiter used in the csv file.
* `omegasheets.csvHeader`: Specifies whether the csv file has a header row.