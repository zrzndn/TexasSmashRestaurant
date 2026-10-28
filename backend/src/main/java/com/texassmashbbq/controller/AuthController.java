package com.texassmashbbq.controller;

import com.texassmashbbq.model.User;
import com.texassmashbbq.repository.UserRepository;
import com.texassmashbbq.service.RestaurantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final RestaurantService restaurantService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final CsrfTokenRepository csrfTokenRepository;

    public AuthController(RestaurantService restaurantService,
                          UserRepository userRepository,
                          AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository,
                          SessionAuthenticationStrategy sessionAuthenticationStrategy,
                          CsrfTokenRepository csrfTokenRepository) {
        this.restaurantService = restaurantService;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    @GetMapping("/csrf")
    public ResponseEntity<CsrfTokenResponse> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(new CsrfTokenResponse(csrfToken.getToken()));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthUser> register(@Valid @RequestBody RestaurantService.RegistrationRequest request) {
        User created = restaurantService.registerCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toAuthUser(created));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletRequest servletRequest,
                                   HttpServletResponse servletResponse) {
        if (request.email() == null || request.email().isBlank() || request.password() == null || request.password().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Enter your email and password."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.email().trim().toLowerCase(Locale.ROOT),
                            request.password()
                    )
            );
            sessionAuthenticationStrategy.onAuthentication(authentication, servletRequest, servletResponse);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, servletRequest, servletResponse);
            csrfTokenRepository.saveToken(null, servletRequest, servletResponse);

            User account = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new AuthenticationServiceException("Authenticated account could not be loaded"));
            return ResponseEntity.ok(toAuthUser(account));
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Email or password is incorrect."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       HttpServletResponse response,
                                       Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        csrfTokenRepository.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUser> currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.noContent().build();
        }
        return userRepository.findByEmail(authentication.getName())
                .map(user -> ResponseEntity.ok(toAuthUser(user)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    private AuthUser toAuthUser(User user) {
        return new AuthUser(user.getEmail(), user.getFullName(), user.getRoles().stream().sorted().toList());
    }

    public record LoginRequest(String email, String password) {}
    public record AuthUser(String email, String fullName, List<String> roles) {}
    public record CsrfTokenResponse(String csrfToken) {}
    public record ErrorResponse(String message) {}
}
