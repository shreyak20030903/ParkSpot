package com.Shreya.parkspot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ParkSpotApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParkSpotApplication.class, args);
	}

}
