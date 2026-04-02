# helloworld — JBoss EAP + Keycloak SAML

This project extends the [JBoss EAP helloworld quickstart](https://github.com/jboss-developer/jboss-eap-quickstarts/tree/8.0.x/helloworld) with a **SAML-protected** servlet and deployment descriptors aligned with Red Hat’s guide: [Securing applications deployed on JBoss EAP with Single Sign-On](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default) — in particular [Securing web applications using SAML](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#securing-web-applications-using-saml_securing-applications-with-saml).

| URL | Behavior |
|-----|----------|
| `http://localhost:8080/helloworld/` | Landing page with links |
| `http://localhost:8080/helloworld/HelloWorld` | Public “Hello World” servlet |
| `http://localhost:8080/helloworld/secured` | **SAML** — requires authentication and the `Admin` role |

The WAR context path is **`/helloworld`** (artifact `helloworld.war`).

---

## Prerequisites

- **JBoss EAP 8.x** with the **Keycloak SAML adapter** available via Galleon (not a plain community WildFly unless you add the same feature pack yourself).
- **Java 17** and **Maven 3.6+**.
- **Red Hat build of Keycloak** (or compatible Keycloak) reachable from the browser and from JBoss EAP (for SAML back-channel if used).

---

## 1. Install the Keycloak SAML adapter layer on JBoss EAP

SAML integration uses the **Keycloak SAML adapter Galleon pack** and the **`keycloak-client-saml`** layer (for servlet applications on bare metal). This matches the [Application security with SAML in JBoss EAP](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#application-security-with-saml-in-jboss-eap_securing-applications-with-saml) section of the documentation.

1. Use **`jboss-eap-installation-manager`** to add the feature pack and layer, as described in *Adding Feature Packs to existing JBoss EAP Servers using the jboss-eap-installation-manager* (see the EAP Installation Methods guide linked from the SSO doc).

2. Feature pack (from the doc): **`org.keycloak:keycloak-saml-adapter-galleon-pack`**.

3. Layer for servlet-only SSO: **`keycloak-client-saml`**.

4. Start the server (default HTTP **8080**).

---

## 2. Run Keycloak on a different HTTP port

JBoss EAP and Keycloak must not both bind to **8080**. Start Keycloak in dev mode on another port (example **8180**):

```bash
/path/to/keycloak/bin/kc.sh start-dev --http-port 8180
```

Open the admin console, for example: `http://localhost:8180/`.

---

## 3. Create a realm, user, and role in Keycloak

Follow [Creating a realm and users in Red Hat build of Keycloak](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#creating-a-realm-and-users-in-red-hat-build-of-keycloak_creating-an-example-application-to-secure-with-single-sign-on) in the same guide. Minimum for this example:

1. Create a realm (e.g. `example_saml_realm`).
2. Create a user and set a non-temporary password.
3. Create a realm role named **`Admin`** (must match `web.xml`).
4. Assign the **`Admin`** role to that user under **Users → Role mapping**.

---

## 4. Create the SAML client in Keycloak

Follow [Creating a SAML client in Red Hat build of Keycloak](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#creating-a-saml-client-in-red-hat-build-of-keycloak_securing-applications-with-saml).

Use these values for **this** WAR deployed as **`helloworld.war`** on `http://localhost:8080` (adjust host/port if yours differ):

| Setting | Example value |
|--------|----------------|
| **Client type** | SAML |
| **Client ID** | `http://localhost:8080/helloworld/secured/` — must **exactly** match the URL of the secured application path ([doc note](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#creating-a-saml-client-in-red-hat-build-of-keycloak_securing-applications-with-saml)). |
| **Root URL** | `http://localhost:8080/helloworld/` |
| **Home URL** | `http://localhost:8080/helloworld/` — required so **SP entity ID** is not empty. |
| **Valid redirect URIs** | `http://localhost:8080/helloworld/secured/*` |
| **Master SAML processing URL** | `http://localhost:8080/helloworld/saml` — must end with **`saml`** ([doc](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#creating-a-saml-client-in-red-hat-build-of-keycloak_securing-applications-with-saml)). |

Save the client.

---

## 5. Install SAML adapter configuration in the deployment

You can either keep configuration **inside the WAR** (this repo) or configure the **`keycloak-saml`** subsystem on the server; the documentation describes both. This project uses **deployment configuration** ([Deployment configuration](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#deployment-configuration_application-security-with-saml-in-jboss-eap)):

1. In Keycloak: **Clients → your SAML client → Action → Download adapter config**.
2. Choose the format that matches your install (e.g. **Keycloak SAML subsystem XML** or the XML intended for `WEB-INF/keycloak-saml.xml`).
3. **Replace** the contents of `src/main/webapp/WEB-INF/keycloak-saml.xml` in this project with the downloaded file.
4. Update **realm / host / port** in that file if your Keycloak base URL is not `http://localhost:8180/realms/example_saml_realm`.

`WEB-INF/web.xml` already sets:

- `<auth-method>SAML</auth-method>`
- A security constraint on `/secured` requiring the **`Admin`** role.

Rebuild after any change to `keycloak-saml.xml`.

---

## 6. Build and deploy to JBoss EAP

From the `helloworld` directory:

```bash
mvn clean package
```

Deploy the WAR (with EAP running):

```bash
mvn wildfly:deploy
```

Or copy `target/helloworld.war` to the EAP deployments directory.

---

## 7. Verify

1. Open `http://localhost:8080/helloworld/secured`.
2. You should be redirected to the Keycloak login page.
3. Sign in with the user that has the **`Admin`** role.
4. You should see **Secured Servlet** with **Current Principal** showing your username (or the configured SAML name).

If you see **NO AUTHENTICATED USER** without a redirect, SAML is not active: confirm the **`keycloak-client-saml`** layer is installed, `keycloak-saml.xml` is valid and matches the client, and the deployment has no errors in the server log.

## Keycloak IdP-initiated SAML with Keycloak broker in between
0. Create a SAML broker in eapdemo realm with name eap-broker and use idp realm.
1. Create a client in Identity provider realm and set "IDP-Initiated SSO URL name " like for this example to simple-saml-app-idp.
2. The "Master SAML Processing URL" will point to following url http://localhost:8081/realms/BROKER_REALM/broker/BROKER_NAME/endpoint/clients/NAME_CLIENT_TO_REDIRECT_TO
```
http://localhost:8081/realms/eapdemo/broker/eap-broker/endpoint/clients/helloworld
```
3. Start with client idp initiated url created in step 1.
```
http://localhost:8081/realms/eapidp/protocol/saml/clients/simple-saml-app-idp
```


### Troubleshooting: `HTTP method POST is not supported by this URL`

The IdP returns the SAML assertion with an **HTTP POST** to the Service Provider’s **SAML processing URL**. That URL must be the Keycloak adapter endpoint, which by default is **`/saml`** under the deployment context (for this WAR: `http://localhost:8080/helloworld/saml`).

If **Master SAML Processing URL** (or ACS / consumer URL) in Keycloak is set to **`/helloworld/secured`** (or any path served only by `SecuredServlet`), the POST hits a servlet that only implements **`doGet`**, and the container returns **405** with a message like *HTTP method POST is not supported by this URL*.

**Fix:** In the Keycloak SAML client, set **Master SAML Processing URL** to:

`http://localhost:8080/helloworld/saml`

(It must end with **`saml`**, per the [Red Hat SSO documentation](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#creating-a-saml-client-in-red-hat-build-of-keycloak_securing-applications-with-saml).) Keep **Client ID** / **Home URL** as you already configured for the app; **Valid redirect URIs** can still include `http://localhost:8080/helloworld/secured/*` for where the browser lands after login.

---

## Optional: subsystem-only configuration

If you prefer **not** to ship `keycloak-saml.xml` in the WAR, configure the **`keycloak-saml`** subsystem in the server and use the CLI script generated from Keycloak (**Generating client adapter config** in the Keycloak administration documentation). The Red Hat SSO guide shows an example **`keycloak-saml-subsystem.cli`** and the `jboss-cli.sh -c --file=...` invocation.

---

## References

- [Chapter 2 — Securing applications deployed on JBoss EAP with Single Sign-On](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default) (EAP 8.1)
- [Keycloak SAML adapter feature pack](https://docs.redhat.com/en/documentation/red_hat_jboss_enterprise_application_platform/8.1/html/using_single_sign-on_with_jboss_eap/securing-applications-deployed-on-server-with-single-sign-on_default#keycloak-saml-adapter-feature-pack-for-securing-applications-using-saml_keycloak-saml-adapter-feature-pack-for-securing-applications-using-saml) (layers and use cases)
