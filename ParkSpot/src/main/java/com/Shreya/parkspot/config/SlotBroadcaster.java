package com.Shreya.parkspot.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Component
public class SlotBroadcaster {

    @Autowired
    private SimpMessagingTemplate template;

    // Tells every screen watching this building to refetch its bays.
    // If a transaction is running, the message is sent after it commits,
    // so clients never refetch data that is not saved yet.
    public void buildingChanged(UUID buildingId) {
        Runnable send = () -> template.convertAndSend("/topic/building/" + buildingId, "changed");
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }
}
