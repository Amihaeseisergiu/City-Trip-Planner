package com.amihaeseisergiu.citytripplanner.registration;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/register")
@AllArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @GetMapping
    String register(Model model) {

        model.addAttribute("user", new AppUser());
        return "register";
    }

    @PostMapping
    public String register(@ModelAttribute("user") AppUser appUser)
    {
        registrationService.register(appUser);

        return "redirect:/login";
    }

    @GetMapping(path = "confirm")
    public String confirm(@RequestParam("token") String token)
    {
        registrationService.confirmToken(token);

        return "login";
    }
}
