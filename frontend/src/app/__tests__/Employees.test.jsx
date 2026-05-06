import React from 'react'
import PropTypes from 'prop-types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import EmployeesPage from '../../../app/employees/page'

// Mock components with PropTypes
const EmployeeTableComponent = ({ onSelectEmployee }) => (
  <div>
    <button onClick={() => onSelectEmployee({ id: 'e1', name: 'E One' })}>Select</button>
  </div>
)
EmployeeTableComponent.propTypes = {
  onSelectEmployee: PropTypes.func.isRequired,
}

const EmployeeProfileComponent = ({ employee }) => (
  <div>Profile: {employee?.name}</div>
)
EmployeeProfileComponent.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
}

const HeaderComponent = ({ title }) => <div>{title}</div>
HeaderComponent.propTypes = {
  title: PropTypes.string.isRequired,
}

// Mock aliased components so the page import resolves to our stubs
jest.mock('@/components/employees/employee-table', () => ({ EmployeeTable: EmployeeTableComponent }))
jest.mock('@/components/employees/employee-profile', () => ({ EmployeeProfile: EmployeeProfileComponent }))

// Mock dashboard parts referenced by the page
jest.mock('@/components/dashboard/sidebar', () => ({ Sidebar: () => <div /> }))
jest.mock('@/components/dashboard/header', () => ({ Header: HeaderComponent }))

describe('Employees page', () => {
  it('shows employee profile after selection', async () => {
    render(<EmployeesPage />)
    const btn = await screen.findByRole('button', { name: /select/i })
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(await screen.findByText(/Profile: E One/)).toBeInTheDocument()
  })
})
