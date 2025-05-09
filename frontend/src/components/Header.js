import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 40px;
  border-bottom: 1px solid #eaeaea;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 28px;
  color: #333;
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 18px;
  transition: color 0.2s ease;

  &:hover {
    color: #0066cc;
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Logo>ClipTagger</Logo>
      <Nav>
        <NavLink to="/">Upload</NavLink>
        <NavLink to="/library">Library</NavLink>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
