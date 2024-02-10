# About the project:
A real-time data messaging client using RabbitMQ to publish and receive GPS location updates every few minutes. The client calculates the distance to each of the other clients and displays the data in UI.


# How to start the server and client for the app
* The zip contains 2 folders
    * messageapp (backend)
    * messageappui (frontend)
      
* Starting the server:
    * Open the messageapp folder in IntelliJ or any other similar tool
    * Openthefile:
        * src/main/java/com/jcaassignment/messageapp/MessageappApplication.java
    * Right click on the file and press “Run”
      
* Starting the client
    * Open the messageappui folder in VSCode or any other similar tool
    * Run‘npminstall’ on the root folder to install the required node modules for this project
    * Click on the ▶ near the start in NPM Scripts
    * Go to http://localhost:3000/
    * Every opened localhost window is a different client
