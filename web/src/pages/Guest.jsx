import React, { useState } from 'react'
import { useWeb3 } from '../contexts/Web3Context'


export default function Guest(){
const { requestRole } = useWeb3()
const [role, setRole] = useState('producer')
async function onRequest(){
await requestRole(role)
alert('Role requested — wait admin approval')
}
return (
<div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
<h2 className="text-lg font-semibold">Request access</h2>
<div className="mt-4">
<label className="block">Role</label>
<select value={role} onChange={e=>setRole(e.target.value)} className="mt-1 p-2 border rounded w-full">
<option value="producer">Producer</option>
<option value="factory">Factory</option>
<option value="retailer">Retailer</option>
<option value="consumer">Consumer</option>
</select>
</div>
<button onClick={onRequest} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Request Role</button>
</div>
)
}