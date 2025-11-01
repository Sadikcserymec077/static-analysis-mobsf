import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';

export default function NavBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="md" className="mb-3">
      <Container fluid>
        <Navbar.Brand href="#">MobSF UI</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link href="#">Dashboard</Nav.Link>
            <Nav.Link href="#">Reports</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link href="http://localhost:8000" target="_blank" rel="noreferrer">
              <i className="bi bi-box-arrow-up-right"></i> MobSF
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
