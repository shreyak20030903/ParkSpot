package com.Shreya.parkspot.Dto;

import java.math.BigDecimal;

public record PricingOptionDto(String label, int minutes, BigDecimal price) {}