# 🗺️ ShadeMap download tool

The **🗺️ ShadeMap download tool** is an interactive tool that allows to export shadow and sun exposure layers from [ShadeMap](https://shademap.app/) over a custom area, with a high level of detail.

It aims to overcome the focus loss when exporting wide areas at ShadeMap online app. To achieve this, **🗺️ ShadeMap download tool** divides the selected area into smaller ones and for each captures the required layer with a higher level of focus, aggregating them automatically into a single TIFF file.

It is based on [Ted Piotrowski's work](https://github.com/ted-piotrowski/shademap-examples), which provides example scripts to export ShadeMap data, extending its scope to several layers and introducing an interactive user interface, that allows anyone to smoothly execute exports using their browser, without the need to download or edit any code. It also introduces batch exports, allowing to cover several timestamps in the same export operation.

Developed by [U-shift](https://ushift.tecnico.ulisboa.pt), a research group from Instituto Superior Técnico, Lisboa, Portugal.