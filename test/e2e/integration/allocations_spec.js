/// <reference types="Cypress" />

describe("/allocations behaviour", () => {
  "use strict";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/allocations/1");
    cy.url().should("include", "login");
  });

  it("Should deny access to another user's allocations", () => {
    cy.userSignIn();
    cy.request({url: "/allocations/someOtherUserId", failOnStatusCode: false})
      .its("status").should("eq", 403);
  });

  it("Should be accesible for a logged user via navigation link", () => {
    cy.userSignIn();
    cy.visitPage("/dashboard");
    cy.get("#allocations-menu-link").click();
    cy.url().should("include", "allocations");
  });

  it("Should be an input", () => {
    cy.userSignIn();
    cy.visitPage("/dashboard");
    cy.get("#allocations-menu-link").click();
    cy.get("input[name='threshold']");
  });

  it("Should redirect the user", () => {
    const threshold = 2;
    cy.userSignIn();
    cy.visitPage("/dashboard");
    cy.get("#allocations-menu-link").click();

    cy.get("input[name='threshold']")
      .clear()
      .type(threshold);

    cy.get("button[type='submit']")
      .click();

    cy.location().should((loc) => {
      expect(loc.search).to.eq(`?threshold=${threshold}`);
      expect(loc.pathname).to.include("/allocations/");
    });
  });
});
