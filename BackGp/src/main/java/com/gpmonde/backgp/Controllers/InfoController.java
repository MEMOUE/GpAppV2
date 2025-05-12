package com.gpmonde.backgp.Controllers;

import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor; 
import org.springframework.http.ResponseEntity; 
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/ws")
public class InfoController {

    @GetMapping("/info")
    public ResponseEntity<String> getInfo() {
        return ResponseEntity.ok("Info response OK");
    }
}
