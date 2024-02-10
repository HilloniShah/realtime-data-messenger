package com.jcaassignment.messageapp.model;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString

public class Message {
    private String senderName;
    private String receiverName;
    private String message;
    private String date;
    private Status status;
    private String latitude;
    private String longitude;

}
