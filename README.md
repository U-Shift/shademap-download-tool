# 🗺️ ShadeMap download tool



## Web app

The **🗺️ ShadeMap download tool** can be used directly in the browser, without any installation required.

[![](/images/printscreen.png)](https://ushift.tecnico.ulisboa.pt/apps/shademap)

https://ushift.tecnico.ulisboa.pt/apps/shademap



## About

The **🗺️ ShadeMap download tool** is an interactive tool that allows to export shadow and sun exposure layers from [ShadeMap](https://shademap.app/) over a custom area, with a high level of detail.

It aims to overcome the focus loss when exporting wide areas at ShadeMap online app. To achieve this, **🗺️ ShadeMap download tool** divides the selected area into smaller ones and for each captures the required layer with a higher level of focus, aggregating them automatically into a single TIFF file.

It is based on [Ted Piotrowski's work](https://github.com/ted-piotrowski/shademap-examples), which provides example scripts to export ShadeMap data, extending its scope to several layers and introducing an interactive user interface, that allows anyone to smoothly execute exports using their browser, without the need to download or edit any code. It also introduces batch exports, allowing to cover several timestamps in the same export operation.


## How to use it?

This tool relies on Mapbox and ShadeMap services. So, to use it, you need to provide API keys for these services. They can be created <u>for free</u>, at:

- [Mapbox API key tutorial](https://docs.mapbox.com/help/getting-started/access-tokens/)            
- [Shademap API key page](https://shademap.app/about/#) (click on "Get API key", it will be sent to your email)             

Once you fill the API keys and submit them, the tool will display the download form, which you can edit according to your needs. To download the selected layer, just click on the download button on the bottom.

> If you need help, click on **ℹ️ Help** on the top-right corner of the form.



## Help

Refer to [FAQ.md](./FAQ.md) for frequently asked questions and answers about the tool.


## Authors

[Gonçalo F. Matos](https://orcid.org/0009-0001-3489-1732) (Author, Maintainer)

[Rosa Félix](https://orcid.org/0000-0002-5642-6006) (Author)

## Citing this work

F. Matos, G., & Félix, R. (2026). ShadeMap download tool (Version 1.1) [Computer software]. https://github.com/U-Shift/shademap-download-tool

```tex
@software{,
    author = {F. Matos, Gonçalo and Félix, Rosa},
    license = {GPL-3.0},
    month = jun,
    title = {{ShadeMap download tool}},
    url = {https://github.com/U-Shift/shademap-download-tool},
    version = {1.1},
    year = {2026}
}
```

## Acknowledgement

**🗺️ ShadeMap download tool** is developed and maintained by
[U-Shift](https://ushift.tecnico.ulisboa.pt) urban mobility research
group, part of [CERIS](https://ceris.pt/) research unit, at [Instituto
Superior Técnico](https://tecnico.ulisboa.pt/pt/), Lisbon, Portugal.

<br/>

<img src="images/logo_acknowledgement.png" width="75%">
