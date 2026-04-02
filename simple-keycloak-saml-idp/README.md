# Keycloak IdP-initiated SAML — quickstart

This project is a **minimal Spring Boot 3** app that acts as a **SAML 2.0 service provider (SP)**. It pairs with **Keycloak** as the **identity provider (IdP)** so you can try **IdP-initiated SSO**: the user starts from Keycloak (or a bookmarked IdP URL), Keycloak issues a SAML assertion, and the browser posts it to this app’s assertion consumer service (ACS).

**Contrast:** In **SP-initiated** SSO, the user first hits the app, gets redirected to Keycloak to log in, then returns. In **IdP-initiated** SSO, the flow starts at Keycloak (after login, Keycloak sends the SAML response to the app without the app having sent an `AuthnRequest` first).

---

## Prerequisites

- **Java 17**
- **Maven 3.8+**
- **Keycloak** reachable from your machine (this guide assumes Keycloak on **port 8081** and the app on **port 8080** — adjust URLs if yours differ).

---

## 1. Run Keycloak

Start Keycloak however you prefer (zip, container, etc.) so the admin console is available, e.g. `http://localhost:8081`.

Create a realm named **`demo`** (or keep your realm name and update `application.yml`).

---

## 2. Create a SAML client in Keycloak

In realm **`demo`**: **Clients → Create client**.

| Concept | Value to use |
|--------|----------------|
| **Client type** | SAML |
| **Client ID** | Must match **`spring.security.saml2.relyingparty.registration.keycloak.entity-id`** in `application.yml` **character-for-character**. This repo defaults to `http://localhost:8080/saml2/service-provider-metadata/keycloak`. Keycloak puts this value in the SAML **Audience**; Spring validates it against the SP `entity-id`. |
| **Valid redirect URIs** | `http://localhost:8080/*` (or your app base URL with `/*`). |
| **Root URL** (optional) | `http://localhost:8080` |
| **Master SAML Processing URL** / **ACS** | Spring Security’s default ACS for this registration is:<br>`http://localhost:8080/login/saml2/sso/keycloak`<br>(`keycloak` is the **registration ID** in `application.yml`.) |

**IdP-initiated SSO (Keycloak-specific):**

1. Open the SAML client → **Settings** (or **Advanced** depending on version).
2. Set **IDP Initiated SSO URL Name** to a short slug with **no spaces**, e.g. `simple-saml-app`.
3. Save.

Keycloak will expose an IdP-initiated URL of the form:

```text
http://localhost:8081/realms/demo/protocol/saml/clients/simple-saml-app
```

(On older Keycloak versions the path sometimes included `/auth` after the host.)

**Signing (two different things):**

1. **SP → IdP (AuthnRequest):** This quickstart does **not** sign requests. Turn **off** “client signature required” for this SAML client where applicable, and keep **`assertingparty.singlesignon.sign-request: false`** in `application.yml` so Spring does not require `signing.credentials` at startup.

2. **IdP → SP (SAML Response / Assertion):** SAML 2.0 requires **either** the Response **or** the Assertion to be signed. Keycloak will show an error like *“Either the response or one of the assertions is unsigned…”* if neither is signed. In the SAML client, open **Settings** (or **Signature and Encryption**, depending on version) and enable **Sign assertions** (or **Sign documents** / equivalent). The realm must have an active **RSA signing** key (**Realm settings → Keys**).

The Spring demo skips validating those signatures in code; Keycloak still must **emit** a signed SAML message per the protocol.

---

## 3. Audience = Client ID = SP `entity-id`

Keycloak sets the SAML **Audience** to the SAML client’s **Client ID**. This repo sets **`entity-id`** in `application.yml` so the SP metadata and Keycloak stay aligned.

**Note:** `SecurityConfig` is configured for a **local demo** and **does not run Spring’s default SAML assertion/response validation** (no signature or condition checks). In production you would remove that and enforce normal validation; then the audience must match **`entity-id`** exactly.

To confirm the SP metadata matches what you expect, open (after the app is running):

```text
http://localhost:8080/saml2/service-provider-metadata/keycloak
```

The `entityID` on `EntityDescriptor` should match `entity-id` in YAML and Keycloak.

---

## 4. Configure the Spring app

In `src/main/resources/application.yml`:

- **`assertingparty.metadata-uri`** — Keycloak IdP metadata (realm `demo`):

  `http://localhost:8081/realms/demo/protocol/saml/descriptor`

- **`assertingparty.singlesignon.sign-request: false`** — avoids startup failure when metadata marks `WantAuthnRequestsSigned` but you are not configuring SP signing keys.

- **`server.port`** — default **8080** in this repo; change if it clashes with Keycloak.

Property names use **`assertingparty`** (Spring Boot 3), not `identityprovider`.

Include **`entity-id`** on the registration (already in this repo) so it matches Keycloak **Client ID** / assertion **Audience**.

---

## 5. Build and run

```bash
mvn spring-boot:run
```

Maven needs the **Shibboleth** repository in `pom.xml` so **OpenSAML** artifacts resolve (already added in this project).

---

## 6. Try IdP-initiated login

1. Log in to Keycloak as a test user (e.g. via the account console or a realm login page).
2. Open the IdP-initiated URL you configured (example):

   `http://localhost:8081/realms/demo/protocol/saml/clients/simple-saml-app`

3. Keycloak POSTs a SAML response to the ACS URL; Spring Security processes it and establishes a session (this demo skips strict SAML validation — see below).
4. Open `http://localhost:8080/` — you should see the logged-in username.

If the browser shows CSRF errors on the ACS endpoint, configure Spring Security to allow SAML POST endpoints (CSRF exemptions for `/login/saml2/**` are common for SAML).

---

## 7. Optional: SP-initiated login

To compare with IdP-initiated flow, open `http://localhost:8080/` in a **fresh** browser session (or private window). Spring Security redirects to SAML login (`/login/saml2/sso/keycloak`), which triggers an SP-initiated round trip to Keycloak.

---

## Project layout

```text
├── pom.xml
├── README.md
└── src/main/
    ├── java/com/example/demo/
    │   ├── DemoApplication.java
    │   ├── SecurityConfig.java    # SAML login + authenticate all routes
    │   └── HomeController.java
    └── resources/
        └── application.yml
```

---

## Security note (read this)

This project is intentionally **insecure** for ease of learning:

- **No SP signing:** there are no `signing.credentials` in `application.yml`; Keycloak must not require signed `AuthnRequest`s.
- **No SAML validation:** `SecurityConfig` registers an `OpenSaml4AuthenticationProvider` whose response and assertion validators always succeed, so **signatures, audiences, conditions, etc. are not enforced**.

Use **normal Spring defaults** (remove those custom validators, add signing keys if your IdP requires them, and rely on metadata trust) for any real deployment.

---

## Keycloak IdP-initiated SAML with Keycloak broker in between
0. Create a SAML broker in demo realm with name demo-broker and use idp realm.
1. Create a client in Identity provider realm and set "IDP-Initiated SSO URL name " like for this example to simple-saml-app-idp.
2. The "Master SAML Processing URL" will point to following url http://localhost:8081/realms/BROKER_REALM/broker/BROKER_NAME/endpoint/clients/NAME_CLIENT_TO_REDIRECT_TO
```
http://localhost:8081/realms/demo/broker/demo-broker/endpoint/clients/simple-saml-app
```
3. Start with client idp initiated url created in step 1.
```
http://localhost:8081/realms/idp/protocol/saml/clients/simple-saml-app-idp
```

Refer added realm export : idp realm --> Identity provider , demo realm --> has the broker.
   - idp realm redirects(using master processing saml url configured in the client) to broker configured in demo realm
   - demo realm redirects the request received in broker to the right client. This happens because the client name is added in master processing saml url under idp realm client.

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| `relyingPartyRegistrationRepository cannot be null` | `assertingparty` (not `identityprovider`) and valid `metadata-uri`. |
| `Signing credentials must not be empty` | Set `assertingparty.singlesignon.sign-request: false` (this repo does), **or** add `signing.credentials`, **or** disable signed requests in Keycloak so metadata matches. |
| `AudienceRestriction` / audience not valid | Only if you **restore** default SAML validators: Keycloak **Client ID** must equal **`entity-id`**. With this demo’s disabled validators, you may not see this error. |
| Browser: *“Either the response or one of the assertions is unsigned…”* | **Keycloak (IdP)** must sign the SAML Response or Assertion (client **Sign assertions** / **Sign documents**). Ensure the realm has an RSA signing key. This is unrelated to SP `signing.credentials` in Spring. |
| Metadata fetch fails | Keycloak URL reachable from the host running Spring; TLS trust if using HTTPS. |
