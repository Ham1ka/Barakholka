import React from "react";
import { API_BASE } from "./api";

export default function ListingList({ listings }) {
  return (
    <div>
      <h2>Лента объявлений</h2>
      {listings.length === 0 && <p>Объявлений пока нет</p>}
      {listings.map(listing => (
        <div key={listing.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <h3>{listing.title}</h3>
          <p>{listing.description}</p>
          <p>Тип: {listing.type} | Цена: {listing.price}</p>
          <div style={{ display: "flex", gap: "5px" }}>
            {listing.images.map((img, idx) => (
              <img key={idx} src={`${API_BASE.replace('/api', '')}/${img}`} alt="" width="100" />
            ))}
          </div>
          <button
            onClick={() => window.open(`https://t.me/${listing.username}?text=Интересует объявление: ${listing.title}`, "_blank")}
          >
            Написать продавцу
          </button>
        </div>
      ))}
    </div>
  );
}