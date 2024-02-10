/* eslint-disable default-case */
import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient =null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     //map data structure to store the chats. Key is username and Value is the list of chats from that user
    const [publicChats, setPublicChats] = useState([]); 
    const [userLocation] = useState(new Map());
    const [tab,setTab] =useState("CHATROOM");            //to store if user is using public chatroom or private messages
    const [userData, setUserData] = useState({          //storing data into state variable for a user
        username: '',
        receivername: '',
        connected: false,
        latitude: '',
        longitude: '',
        message: ''
      });
    useEffect(() => {
      console.log(userData);
    }, [userData]);

    const connect =()=>{
        let Sock = new SockJS('http://localhost:8080/messageapp');          //connect to this endpoint
        stompClient = over(Sock);                                       //stompClient gets the value as the user connects
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});                                               //changing the connected value for that user to 'true' from 'false'
        stompClient.subscribe('/chatroom/public', onPublicMessageReceived);                         //subscribing the user to the chatroom
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessageReceived);     //subscribing user to listen to themselves
        userJoin();
    }

    const userJoin=()=>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN",
            latitude: userData.latitude,
            longitude: userData.longitude
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));        //sending message to server whenever a user joins
          userLocation.set(userData.username,[userData.latitude, userData.longitude]);
    }

    const onPublicMessageReceived = (payload)=>{            //getting just the payload from stomp object. It has various other params too
        var payloadData = JSON.parse(payload.body);
        switch(payloadData.status){                         //execute switch case depending on the status value (JOIN, MESSAGE, LEAVE) 
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                userLocation.set(payloadData.senderName,[payloadData.latitude, payloadData.longitude]);
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
        }
    }
    
    const onPrivateMessageReceived = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        userLocation.set(payloadData.senderName,[payloadData.latitude, payloadData.longitude]);
        if(privateChats.get(payloadData.senderName)){           //if the map is not empty and the key with given username already exists...
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));             //creating a new map everytime there's a change in value 'coz the whole object isn't getting changed and so useState won't recognise it
        }else{                                           //if the map is empty, we create a new <key,value> pair 
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
        
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});        //set the message value for the particular user
    }

    const sendPublicChatMessage=()=>{
            if (stompClient) {          //to check if stompClient is not null
              var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status:"MESSAGE",
                latitude: userData.latitude,
                longitude: userData.longitude
              };
              console.log(chatMessage);
              stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
              setUserData({...userData,"message": ""});
            }
    }

    const sendPrivateChatMessage=()=>{
        if (stompClient) {
          var chatMessage = {
            senderName: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE",
            latitude: userData.latitude,
            longitude: userData.longitude
          };
          
          if(userData.username !== tab){                //no need to display messages through server, if user chats with themselves. Display those messages directly in the app itself. 
            privateChats.get(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
          }
          stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));    //sending chats to this endpoint  
          setUserData({...userData,"message": ""});
        }
    }

    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});           //change username to what the user enters
    }

    const handleLatitude=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"latitude": value});           //change latitude to what the user enters
    }

    const handleLongitude=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"longitude": value});           //change longitude to what the user enters
    }

    const registerUser=()=>{
        connect();                  //connect user using the websocket 
    }

    function deg2rad(degrees) {
        return degrees * (Math.PI/180);
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        // Your distance calculation code here...
        const R = 3958.8; // Radius of the earth in miles
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in miles
        return distance.toFixed(1);
    }

    return (
    <div className="container">
        
        {userData.connected?                    //show chatbox if user is connected
        <>
            <h1 className="chatbox-title">User: {userData.username}</h1>
            <div className="chat-box">

                {/* Left side of the screen to display list of users */}    
                <div className="member-list">          
                    <ul>
                        <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>
                            Chatroom
                        </li>

                        {[...privateChats.keys()].map((name,index)=>(
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                                {name}
                                {name !== userData.username && userLocation.get(name) && (
                                    <span> ({calculateDistance(userData.latitude, userData.longitude, userLocation.get(name)[0], userLocation.get(name)[1])} miles away)</span>
                                )}
                            </li>
                        ))}

                    </ul>

                    <div class="changeLocation">
                        <label for="latitude" style={{fontWeight: 'bold', fontStyle: 'italic'}}>Latitude: </label>
                        <input
                            class="locationText"
                            id="latitude"
                            placeholder="Enter latitude"
                            name="latitude"
                            value={userData.latitude}
                            onChange={handleLatitude}
                            margin="normal" />
                        <label for="latitude" style={{fontWeight: 'bold', fontStyle: 'italic'}}>Longitude: </label>
                        <input
                            class="locationText"
                            id="longitude"
                            placeholder="Enter longitude"
                            name="longitude"
                            value={userData.longitude}
                            onChange={handleLongitude}
                            margin="normal" />
                    </div>

                    
                </div>

                {/* Right side of the screen to show chats depending on the mode that user is using - private messaging or public chatroom */}
                {tab==="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {publicChats.map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder="Enter public message" value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendPublicChatMessage}>Send</button>
                    </div>
                </div>}

                {tab!=="CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {[...privateChats.get(tab)].map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className="message-data">{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                    <div className="send-message">
                        <input type="text" className="input-message" placeholder={`Enter the message for ${tab}`} value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendPrivateChatMessage}>Send</button>
                    </div>
                </div>}

            </div>
        </>
        :   //show the register box if user is not connected
        <>
            <h1 className="title">Let's Chat</h1>
            <div className='outer'>
            <div className='locations'>
                    <div className="latitude">
                        <input
                            id="latitude"
                            placeholder="Enter latitude"
                            name="latitude"
                            value={userData.latitude}
                            onChange={handleLatitude}
                            margin="normal" />
                    </div>

                    <div className="longitude">
                        <input
                            id="longitude"
                            placeholder="Enter longitude"
                            name="longitude"
                            value={userData.longitude}
                            onChange={handleLongitude}
                            margin="normal" />
                    </div>
                </div>

            <div className='locations'>                
                <div className="register">
                    <input
                        id="user-name"
                        placeholder="Enter your name"
                        name="userName"
                        value={userData.username}
                        onChange={handleUsername}
                        margin="normal" />
                    <button type="button" onClick={registerUser}>
                        connect
                    </button>
                </div>
            </div>
            </div>
        </>}

       
    </div>
    )
}

export default ChatRoom