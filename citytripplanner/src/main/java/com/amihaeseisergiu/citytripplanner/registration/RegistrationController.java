package com.amihaeseisergiu.citytripplanner.registration;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.appuser.AppUserRepository;
import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/register")
@AllArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;
    private final AppUserRepository appUserRepository;

    @ModelAttribute("user")
    public AppUser appUser() {

        return new AppUser();
    }

    @GetMapping
    String register() {

        return "register";
    }

    @PostMapping
    public String register(@ModelAttribute("user") AppUser appUser, BindingResult result)
    {
        boolean userExists = appUserRepository
                .findByEmail(appUser.getEmail())
                .isPresent();

        if (userExists) {
            result.rejectValue("email", null, "There is already an account registered with that email");
        }

        if (result.hasErrors()) {
            return "register";
        }

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
