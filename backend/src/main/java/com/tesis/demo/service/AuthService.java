package com.tesis.demo.service;

import com.tesis.demo.dto.LoginResponseDto;

public interface AuthService {
    LoginResponseDto login(String email, String password);
}
