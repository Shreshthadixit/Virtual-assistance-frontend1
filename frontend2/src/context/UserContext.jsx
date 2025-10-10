import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'

export const userDataContext = createContext()

function UserContext({ children }) {
    const serverUrl = "https://virtual-assistance-frontend1-2.onrender.com"
    const [userData, setUserData] = useState(null)
    const [frontendImage, setFrontendImage] = useState(null)
    const [backendImage, setBackendImage] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    // Fetch current user
    const handleCurrentUser = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/user/current`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            })
            setUserData(result.data)
            console.log("Current User:", result.data)
        } catch (error) {
            console.log("Error fetching current user:", error.response?.data || error.message)
        }
    }

    // Send command to assistant
    const getGeminiResponse = async (command) => {
        try {
            const result = await axios.post(
                `${serverUrl}/api/user/asktoassistant`,
                { command },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            )
            return result.data
        } catch (error) {
            console.log("Error in getGeminiResponse:", error.response?.data || error.message)
        }
    }

    useEffect(() => {
        if (token) handleCurrentUser()
    }, [token])

    const value = {
        serverUrl,
        userData,
        setUserData,
        backendImage,
        setBackendImage,
        frontendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse
    }

    return <userDataContext.Provider value={value}>{children}</userDataContext.Provider>
}

export default UserContext
