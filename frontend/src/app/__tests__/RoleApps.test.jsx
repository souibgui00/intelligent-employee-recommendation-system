import React from 'react';
import PropTypes from 'prop-types';
import { render } from '@testing-library/react';
import AdminApp from '../../AdminApp';
import EmployeeApp from '../../EmployeeApp';
import HRApp from '../../HRApp';
import ManagerApp from '../../ManagerApp';

const routeCalls = [];
const mockUseLocation = jest.fn();

// Component definitions before mocks to avoid hoisting issues with PropTypes
const PortalLayoutComponent = ({ role, children }) => (
  <div data-testid="portal-layout" data-role={role}>
    {children}
  </div>
);

const BadgeComponent = ({ children }) => <span>{children}</span>;

const RoutesComponent = ({ children }) => <div data-testid="routes">{children}</div>;

const RouteComponent = (props) => {
  routeCalls.push(props);
  return <div data-testid={`route-${props.path || 'index'}`} />;
};

const NavigateComponent = ({ to, replace }) => (
  <div data-testid="navigate" data-to={to} data-replace={String(replace)} />
);

// Add PropTypes after component definitions (optional - won't affect mocks)
PortalLayoutComponent.propTypes = {
  role: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

BadgeComponent.propTypes = {
  children: PropTypes.node.isRequired,
};

RoutesComponent.propTypes = {
  children: PropTypes.node.isRequired,
};

RouteComponent.propTypes = {
  path: PropTypes.string,
};

NavigateComponent.propTypes = {
  to: PropTypes.string.isRequired,
  replace: PropTypes.bool,
};

jest.mock('@/components/PortalLayout', () => ({
  PortalLayout: PortalLayoutComponent,
}));

jest.mock('@/components/employees/employee-profile-route-page', () => ({
  EmployeeProfileRoutePage: () => <div data-testid="employee-profile-route" />,
}));

jest.mock('@/lib/data-store', () => ({
  useData: () => ({
    participations: [],
    loading: false,
    fetchCombinedScore: jest.fn().mockResolvedValue({ combinedScore: 0 }),
  }),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: BadgeComponent,
}));

jest.mock('react-router-dom', () => ({
  Routes: RoutesComponent,
  Route: RouteComponent,
  Navigate: NavigateComponent,
  useLocation: () => mockUseLocation(),
}));

describe('Role apps routing', () => {
  beforeEach(() => {
    routeCalls.length = 0;
    mockUseLocation.mockReturnValue({ pathname: '/admin' });
  });

  it('renders AdminApp with admin role by default', () => {
    const { getByTestId } = render(<AdminApp />);
    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'admin');
  });

  it('renders AdminApp with hr role when pathname starts with /hr', () => {
    mockUseLocation.mockReturnValue({ pathname: '/hr/anything' });
    const { getByTestId } = render(<AdminApp />);
    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'hr');
  });

  it('configures AdminApp wildcard redirect to role root', () => {
    render(<AdminApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/admin');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders EmployeeApp with employee role and wildcard redirect', () => {
    const { getByTestId } = render(<EmployeeApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'employee');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/employee');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders HRApp with hr role and wildcard redirect', () => {
    const { getByTestId } = render(<HRApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'hr');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/hr');
    expect(wildcard.element.props.replace).toBe(true);
  });

  it('renders ManagerApp with manager role and wildcard redirect', () => {
    const { getByTestId } = render(<ManagerApp />);
    const wildcard = routeCalls.find((route) => route.path === '*');

    expect(getByTestId('portal-layout')).toHaveAttribute('data-role', 'manager');
    expect(wildcard).toBeDefined();
    expect(wildcard.element.props.to).toBe('/manager');
    expect(wildcard.element.props.replace).toBe(true);
  });
});