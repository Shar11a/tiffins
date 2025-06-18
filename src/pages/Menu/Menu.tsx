import React from 'react'
import MenuToggleTable from './MenuToggleTable/MenuToggleTable'
import MenuTable from '../../components/MenuTable/MenuTable'

const Menu: React.FC = () => {
  return (
    <div>
      <MenuToggleTable />
      <MenuTable />
    </div>
  )
}

export default Menu