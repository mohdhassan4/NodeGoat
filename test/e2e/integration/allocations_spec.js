/// <reference types="Cypress" />

describe("/allocations behaviour", () => {
  "use strict";

  // user1 has _id: 2 in the seeded database
  const userAllocationsPath = "/allocations/2";

  before(() => {
    cy.dbReset();
  });

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage(userAllocationsPath);
    cy.url().should("include", "login");
  });

  it("Should be accesible for a logged user", () => {
    cy.userSignIn();
    cy.visitPage(userAllocationsPath);
    cy.url().should("include", "allocations");
  });

  it("Should reject access to another user allocations", () => {
    cy.userSignIn();
    cy.request({
      url: "/allocations/1",
      failOnStatusCode: false
    }).its("status").should("eq", 403);
  });

  it("Should be an input", () => {
    cy.userSignIn();
    cy.visitPage(userAllocationsPath);
    cy.get("input[name='threshold']");
  });

  it("Should redirect the user", () => {
    const threshold = 2;
    cy.userSignIn();
    cy.visitPage(userAllocationsPath);

    cy.get("input[name='threshold']")
      .clear()
      .type(threshold);

    cy.get("button[type='submit']")
      .click();

    cy.location().should((loc) => {
      expect(loc.search).to.eq(`?threshold=${threshold}`);
      expect(loc.pathname).to.eq(userAllocationsPath);
    });
  });
});
