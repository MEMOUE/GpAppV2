package com.gpmonde.backgp.DTO.OAuth2;

import java.util.Map;

public interface OAuth2UserInfo {
    String getProviderId();
    String getName();
    String getEmail();
    String getImageUrl();
    Map<String, Object> getAttributes();
}