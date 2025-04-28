import { useState } from "react";
import "../css/alert.css";

export default function TopAlert({message, type="info", onClose}){

    return (
        <div className={`top-alert ${type}`}>
            {message}
            <button
            onClick={onClose}
            className="close-button"
            >
            X
            </button>
        </div>
        );
}