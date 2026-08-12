// ============================================================
// EMOTE OVERLAY - BIPKENS
// ============================================================

const url = new URL(window.location.href);

// ============================================================
// KONFIGURACJA
// ============================================================

const config = {
    // Kanał Twitch pobierany z URL
    channel: url.searchParams.get("channel"),

    // Minimalna liczba powtórzeń emotki
    // 2 = pokazuje od 😂 × 2
    // 3 = pokazuje od 😂 × 3
    // itd.
    minStreak: Number(
        url.searchParams.get("minStreak") || 2
    ),

    // Jak długo combo pozostaje na ekranie
    // 10000 = 10 sekund
    // 30000 = 30 sekund
    // 60000 = 60 sekund
    displayTime: Number(
    url.searchParams.get("displayTime") || 10000
),

    // Wielkość emotki
    emoteSize: 80,

    // Pozycja
    // Możesz później zmienić:
    // top: 80
    // left: 50
    positionTop: 80,
    positionLeft: 50,

    // Aktualne combo
    currentStreak: {
        emote: "",
        url: "",
        count: 0
    },

    // Timer znikania
    streakTimer: null,

    // Lista emotek
    emotes: []
};

// ============================================================
// ELEMENT #main
// ============================================================

const main = document.getElementById("main");

main.style.position = "fixed";
main.style.top = `${config.positionTop}%`;
main.style.left = `${config.positionLeft}%`;
main.style.transform = "translate(-50%, -50%)";
main.style.display = "flex";
main.style.alignItems = "center";
main.style.justifyContent = "center";
main.style.gap = "15px";
main.style.fontFamily = "Arial, sans-serif";
main.style.fontSize = "48px";
main.style.fontWeight = "bold";
main.style.color = "white";
main.style.textShadow =
    "3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000";

main.style.opacity = "0";
main.style.pointerEvents = "none";
main.style.zIndex = "999999";

// ============================================================
// POBIERANIE EMOTEK
// ============================================================

async function getEmotes() {

    const proxy =
        "https://api.roaringiron.com/proxy/";

    if (!config.channel) {
        console.error(
            "Brak kanału Twitch w adresie URL."
        );

        return;
    }

    console.log(
        "Ładowanie emotek dla:",
        config.channel
    );

    try {

        // ====================================================
        // TWITCH ID
        // ====================================================

        const twitchResponse =
            await fetch(
                proxy +
                "https://api.ivr.fi/v2/twitch/user?login=" +
                config.channel
            );

        const twitchData =
            await twitchResponse.json();

        const twitchId =
            twitchData?.[0]?.id;

        if (!twitchId) {
            console.error(
                "Nie znaleziono kanału Twitch:",
                config.channel
            );

            return;
        }

        // ====================================================
        // FFZ CHANNEL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://api.frankerfacez.com/v1/room/" +
                    config.channel
                );

            const data =
                await response.json();

            if (data.sets) {

                for (const set of Object.values(data.sets)) {

                    for (const emote of set.emoticons) {

                        config.emotes.push({
                            name: emote.name,
                            url:
                                "https://" +
                                (
                                    emote.urls["2"] ||
                                    emote.urls["1"]
                                )
                                .split("//")
                                .pop()
                        });

                    }

                }

            }

        } catch (error) {

            console.warn(
                "FFZ channel error:",
                error
            );

        }

        // ====================================================
        // FFZ GLOBAL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://api.frankerfacez.com/v1/set/global"
                );

            const data =
                await response.json();

            if (data.sets) {

                for (const set of Object.values(data.sets)) {

                    for (const emote of set.emoticons) {

                        config.emotes.push({
                            name: emote.name,
                            url:
                                "https://" +
                                (
                                    emote.urls["2"] ||
                                    emote.urls["1"]
                                )
                                .split("//")
                                .pop()
                        });

                    }

                }

            }

        } catch (error) {

            console.warn(
                "FFZ global error:",
                error
            );

        }

        // ====================================================
        // BTTV CHANNEL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://api.betterttv.net/3/cached/users/twitch/" +
                    twitchId
                );

            const data =
                await response.json();

            for (const emote of data.channelEmotes || []) {

                config.emotes.push({
                    name: emote.code,
                    url:
                        `https://cdn.betterttv.net/emote/${emote.id}/2x`
                });

            }

            for (const emote of data.sharedEmotes || []) {

                config.emotes.push({
                    name: emote.code,
                    url:
                        `https://cdn.betterttv.net/emote/${emote.id}/2x`
                });

            }

        } catch (error) {

            console.warn(
                "BTTV channel error:",
                error
            );

        }

        // ====================================================
        // BTTV GLOBAL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://api.betterttv.net/3/cached/emotes/global"
                );

            const data =
                await response.json();

            for (const emote of data) {

                config.emotes.push({
                    name: emote.code,
                    url:
                        `https://cdn.betterttv.net/emote/${emote.id}/2x`
                });

            }

        } catch (error) {

            console.warn(
                "BTTV global error:",
                error
            );

        }

        // ====================================================
        // 7TV GLOBAL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://7tv.io/v3/emote-sets/global"
                );

            const data =
                await response.json();

            for (const emote of data.emotes || []) {

                config.emotes.push({
                    name: emote.name,
                    url:
                        `https://cdn.7tv.app/emote/${emote.id}/2x.webp`
                });

            }

        } catch (error) {

            console.warn(
                "7TV global error:",
                error
            );

        }

        // ====================================================
        // 7TV CHANNEL
        // ====================================================

        try {

            const response =
                await fetch(
                    proxy +
                    "https://7tv.io/v3/users/twitch/" +
                    twitchId
                );

            const data =
                await response.json();

            const emoteSet =
                data?.emote_set;

            if (emoteSet?.emotes) {

                for (const emote of emoteSet.emotes) {

                    if (
                        emote.data?.host?.url &&
                        emote.data?.host?.files?.length
                    ) {

                        const file =
                            emote.data.host.files.find(
                                file =>
                                    file.name.includes(".webp")
                            ) ||
                            emote.data.host.files[0];

                        config.emotes.push({
                            name: emote.name,
                            url:
                                "https:" +
                                emote.data.host.url +
                                "/" +
                                file.name
                        });

                    }

                }

            }

        } catch (error) {

            console.warn(
                "7TV channel error:",
                error
            );

        }

        console.log(
            `Załadowano ${config.emotes.length} emotek.`
        );

    } catch (error) {

        console.error(
            "Błąd podczas pobierania emotek:",
            error
        );

    }
}

// ============================================================
// SZUKANIE EMOTKI
// ============================================================

function findEmote(name) {

    return config.emotes.find(
        emote => emote.name === name
    );

}

// ============================================================
// RESET COMBO
// ============================================================

function resetStreak() {

    config.currentStreak = {
        emote: "",
        url: "",
        count: 0
    };

}

// ============================================================
// UKRYWANIE COMBO
// ============================================================

function hideStreak() {

    console.log(
        "TIMER WYGASŁ - RESET COMBO"
    );

    main.style.transition =
        "opacity 0.3s ease, transform 0.3s ease";

    main.style.opacity = "0";

    main.style.transform =
        "translate(-50%, -50%) scale(0.8)";

    setTimeout(() => {

        main.innerHTML = "";

        main.style.transform =
            "translate(-50%, -50%) scale(1)";

    }, 300);

    resetStreak();

    config.streakTimer = null;

}

// ============================================================
// WYŚWIETLANIE COMBO
// ============================================================

function displayStreak() {

    if (
        config.currentStreak.count <
        config.minStreak
    ) {
        return;
    }

    // ================================================
    // RESET TIMERA
    // ================================================

    if (config.streakTimer) {

        clearTimeout(
            config.streakTimer
        );

    }

    // ================================================
    // CZYSZCZENIE
    // ================================================

    main.innerHTML = "";

    // ================================================
    // EMOTKA
    // ================================================

    const img =
        document.createElement("img");

    img.src =
        config.currentStreak.url;

    img.style.width =
        `${config.emoteSize}px`;

    img.style.height =
        "auto";

    img.style.objectFit =
        "contain";

    // ================================================
    // LICZNIK
    // ================================================

    const counter =
        document.createElement("span");

    counter.textContent =
        `× ${config.currentStreak.count}`;

    // ================================================
    // DODANIE
    // ================================================

    main.appendChild(img);
    main.appendChild(counter);

    // ================================================
    // ANIMACJA POJAWIENIA
    // ================================================

    main.style.transition =
        "none";

    main.style.opacity =
        "1";

    main.style.transform =
        "translate(-50%, -50%) scale(0.7)";

    requestAnimationFrame(() => {

        main.style.transition =
            "transform 0.15s ease";

        main.style.transform =
            "translate(-50%, -50%) scale(1.1)";

        setTimeout(() => {

            main.style.transform =
                "translate(-50%, -50%) scale(1)";

        }, 150);

    });

    // ================================================
    // NOWY TIMER
    // ================================================

    config.streakTimer =
        setTimeout(() => {

            hideStreak();

        }, config.displayTime);

}

// ============================================================
// OBSŁUGA WIADOMOŚCI Z TWITCHA
// ============================================================

function handleMessage(
    message,
    tags
) {

    if (!message) {
        return;
    }

    // ========================================================
    // EMOTKI TWITCH
    // ========================================================

    let twitchEmote =
        null;

    if (tags) {

        const emotesTag =
            tags.find(
                tag => tag.startsWith("emotes=")
            );

        if (
            emotesTag &&
            emotesTag !== "emotes="
        ) {

            const data =
                emotesTag
                    .substring(7)
                    .split("/")[0];

            const parts =
                data.split(":");

            const twitchId =
                parts[0];

            const position =
                parts[1];

            if (position) {

                const startEnd =
                    position.split("-");

                const start =
                    Number(startEnd[0]);

                const end =
                    Number(startEnd[1]);

                const emoteName =
                    message.substring(
                        start,
                        end + 1
                    );

                twitchEmote = {
                    name: emoteName,
                    url:
                        `https://static-cdn.jtvnw.net/emoticons/v2/${twitchId}/default/dark/3.0`
                };

            }

        }

    }

    // ========================================================
    // JEŚLI NIE TWITCH → 7TV / BTTV / FFZ
    // ========================================================

    if (!twitchEmote) {

        const words =
            message
                .split(/\s+/)
                .filter(Boolean);

        for (const word of words) {

            const found =
                findEmote(word);

            if (found) {

                twitchEmote = {
                    name: found.name,
                    url: found.url
                };

                break;

            }

        }

    }

    // ========================================================
    // BRAK EMOTKI
    // ========================================================

    if (!twitchEmote) {
        return;
    }

    // ========================================================
    // TA SAMA EMOTKA
    // ========================================================

    if (
        config.currentStreak.emote ===
        twitchEmote.name
    ) {

        config.currentStreak.count++;

    }

    // ========================================================
    // NOWA EMOTKA
    // ========================================================

    else {

        config.currentStreak.emote =
            twitchEmote.name;

        config.currentStreak.url =
            twitchEmote.url;

        config.currentStreak.count =
            1;

    }

    console.log(
        "Emotka:",
        config.currentStreak.emote,
        "×",
        config.currentStreak.count
    );

    displayStreak();

}

// ============================================================
// TWITCH IRC
// ============================================================

function connect() {

    if (!config.channel) {

        console.error(
            "Brak kanału. Użyj ?channel=bipkens"
        );

        return;

    }

    console.log(
        "Łączenie z Twitch:",
        config.channel
    );

    const chat =
        new WebSocket(
            "wss://irc-ws.chat.twitch.tv"
        );

    // ========================================================
    // POŁĄCZENIE
    // ========================================================

    chat.onopen = () => {

        console.log(
            "Połączono z Twitch IRC"
        );

        chat.send(
            "CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership"
        );

        // Anonimowy użytkownik
        chat.send(
            "PASS SCHMOOPIIE"
        );

        chat.send(
            "NICK justinfan123"
        );

        chat.send(
            `JOIN #${config.channel}`
        );

        getEmotes();

    };

    // ========================================================
    // WIADOMOŚĆ
    // ========================================================

    chat.onmessage = event => {

        const lines =
            event.data.split("\r\n");

        for (const line of lines) {

            if (!line) {
                continue;
            }

            // PING
            if (
                line.startsWith("PING")
            ) {

                chat.send(
                    "PONG :tmi.twitch.tv"
                );

                continue;

            }

            // =================================================
            // PRIVMSG
            // =================================================

            if (
                line.includes(
                    " PRIVMSG "
                )
            ) {

                const messageStart =
                    line.indexOf(
                        " :",
                        line.indexOf(
                            " PRIVMSG "
                        )
                    );

                if (
                    messageStart === -1
                ) {
                    continue;
                }

                const message =
                    line.substring(
                        messageStart + 2
                    );

                const tagPart =
                    line.startsWith("@")
                        ? line.substring(
                            1,
                            line.indexOf(" ")
                        )
                        : "";

                const tags =
                    tagPart
                        ? tagPart.split(";")
                        : [];

                handleMessage(
                    message,
                    tags
                );

            }

        }

    };

    // ========================================================
    // BŁĄD
    // ========================================================

    chat.onerror = error => {

        console.error(
            "Błąd Twitch IRC:",
            error
        );

    };

    // ========================================================
    // ROZŁĄCZENIE
    // ========================================================

    chat.onclose = () => {

        console.log(
            "Rozłączono. Ponowna próba za 5 sekund..."
        );

        setTimeout(
            connect,
            5000
        );

    };

}

// ============================================================
// START
// ============================================================

connect();
