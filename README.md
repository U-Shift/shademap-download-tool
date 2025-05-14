# 🗺️ ShadeMap download tool



## Web app

The **🗺️ ShadeMap download tool** can be used directly in the browser, without any installation required.

https://ushift.tecnico.ulisboa.pt/apps/shademap



## About

The **🗺️ ShadeMap download tool** is an interactive tool that allows to export shadow and sun exposure layers from [ShadeMap](https://shademap.app/) over a custom area, with a high level of detail.

It aims to overcome the focus loss when exporting wide areas at ShadeMap online app. To achieve this, **🗺️ ShadeMap download tool** divides the selected area into smaller ones and for each captures the required layer with a higher level of focus, aggregating them automatically into a single TIFF file.

It is based on [Ted Piotrowski's work](https://github.com/ted-piotrowski/shademap-examples), which provides example scripts to export ShadeMap data, extending its scope to several layers and introducing an interactive user interface, that allows anyone to smoothly execute exports using their browser, without the need to download or edit any code. It also introduces batch exports, allowing to cover several timestamps in the same export operation.

Developed by [U-shift](https://ushift.tecnico.ulisboa.pt), a research group from Instituto Superior Técnico, Lisboa, Portugal.



## How to use it?

This tool relies on Mapbox and ShadeMap services. So, to use it, you need to provide API keys for these services. They can be created <u>for free</u>, at:

- [Mapbox API key tutorial](https://docs.mapbox.com/help/getting-started/access-tokens/)            
- [Shademap API key page](https://shademap.app/about/#) (click on "Get API key", it will be sent to your email)             

Once you fill the API keys and submit them, the tool will display the download form, which you can edit according to your needs. To download the selected layer, just click on the download button on the bottom.

> If you need help, click on **ℹ️ Help** on the top-right corner of the form.



## Help

### Form

**What are the NW and SE coordinates for?**                

> The export is generated over a square area, defined with the north-west and south-east corners coordinates, for a specific date and time, with the level of detail specified by the zoom level.            

**What is the zoom level?**

> To generate the export, the defined area is divided into smaller ones, to capture the Shadow Map with a higher level of detail. The zoom level will influence the area of these smaller squares, with a higher value reducing its size and increasing the level of detail. 15 is the default value and provides a high level of detail. 


**What is the iterations parameter, on the sun exposure form?**                

>  According to the ShadeMap documentation: "Number of discrete chunks to calculate shadows for between startDate and endDate. A larger number will provide more detail but take longer to compute."                

### File export

**Why am I getting more than one TIFF file per export?**                

> Because of computer memory limitations, areas that  exceed the browser processing capacity are divided into several TIFFs,  each one aggregating the maximum number of subareas possible.                

**What is the coordinate reference of the file generated?**                 

>  The file is generated according to the WGS 84 coordinate reference system (EPSG:4326).                

**How can I interpret the values of the file generated?**                

>  Shadows are exported in a binary system: 0 for shadows, 255 for sun. Sun light exposure values range from 0 to 240, and can be converted to the total minutes of sun exposure by multiplying this value by 6.                                    

### Privacy

**Is it safe to check the box to store the API credentials?**                 

> The API key is stored on the local storage of your browser, in plain text. It is not sent to other services rather than the Mapbox and ShadeMap APIs. The APIs are accessed directly from your browser, without any brokers.                

**Can I delete the credentials, once stored?**                

> Yes, just reload the page, and enter the application again, but this time unchecking the box to save credentials. Once you access after this, they will be removed.                