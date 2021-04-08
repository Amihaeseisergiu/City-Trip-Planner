package com.amihaeseisergiu.citytripplanner;

import com.amihaeseisergiu.citytripplanner.itinerary.ItineraryService;
import com.amihaeseisergiu.citytripplanner.planner.PlannerService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.UUID;

@Controller
@RequestMapping("/")
@AllArgsConstructor
public class MainController {

    private final ItineraryService itineraryService;
    private final PlannerService plannerService;

    @GetMapping
    public String index()
    {

        return "index";
    }

    @GetMapping("/login")
    public String login()
    {
        return "login";
    }

    @GetMapping("/logout")
    public String logoutPage(HttpServletRequest request, HttpServletResponse response)
    {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null){
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }

        return "redirect:/login?logout";
    }

    @GetMapping("/itinerary/{id}")
    public String itinerary(@PathVariable UUID id)
    {
        if(itineraryService.getItineraryById(id) != null)
        {
            return "itinerary";
        }
        else
        {
            return "error";
        }
    }

    @GetMapping("/restricted/{id}")
    public String restricted(@PathVariable UUID id)
    {
        if(plannerService.getUserPlanner(id) != null)
        {
            return "restricted";
        }
        else
        {
            return "error";
        }
    }

    @GetMapping("/unrestricted/{id}")
    public String unrestricted(@PathVariable UUID id)
    {
        if(plannerService.getUserPlanner(id) != null)
        {
            return "unrestricted";
        }
        else
        {
            return "error";
        }
    }
}