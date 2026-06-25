# Help

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