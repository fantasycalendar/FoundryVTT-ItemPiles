import {CONSTANTS, MODULE_SETTINGS} from "../constants";

export function isGMConnected()
{
   return !!Array.from(game.users).find(user => user.isGM && user.active);
}

export function wait(ms)
{
   return new Promise(resolve => setTimeout(resolve, ms));
}

export function debug(msg, args = "")
{
   if (game.settings.get(CONSTANTS.MODULE_NAME, "debug"))
   {
      console.log(`DEBUG | Item Piles | ${msg}`, args)
   }
}

export function custom_notify(message)
{
   message = `Item Piles | ${message}`;
   ui.notifications.notify(message);
   console.log(message.replace("<br>", "\n"));
}

export function custom_warning(warning, notify = false)
{
   warning = `Item Piles | ${warning}`;
   if (notify)
   {
      ui.notifications.warn(warning);
   }
   console.warn(warning.replace("<br>", "\n"));
}

export function custom_error(error, notify = true)
{
   error = `Item Piles | ${error}`;
   if (notify)
   {
      ui.notifications.error(error);
   }
   return new Error(error.replace("<br>", "\n"));
}

export function isVersion9()
{
   return isNewerVersion((game?.version ?? game.data.version), "9.00");
}

export function getTokensAtLocation(position)
{
   const tokens = [...canvas.tokens.placeables];
   return tokens.filter(token =>
   {
      return position.x >= token.x && position.x < (token.x + (token.data.width * canvas.grid.size))
       && position.y >= token.y && position.y < (token.y + (token.data.height * canvas.grid.size));
   });
}

export function distance_between_rect(p1, p2)
{

   const x1 = p1.x;
   const y1 = p1.y;
   const x1b = p1.x + p1.w;
   const y1b = p1.y + p1.h;

   const x2 = p2.x;
   const y2 = p2.y;
   const x2b = p2.x + p2.w;
   const y2b = p2.y + p2.h;

   const left = x2b < x1;
   const right = x1b < x2;
   const bottom = y2b < y1;
   const top = y1b < y2;

   if (top && left)
   {
      return distance_between({x: x1, y: y1b}, {x: x2b, y: y2});
   }
   else if (left && bottom)
   {
      return distance_between({x: x1, y: y1}, {x: x2b, y: y2b});
   }
   else if (bottom && right)
   {
      return distance_between({x: x1b, y: y1}, {x: x2, y: y2b});
   }
   else if (right && top)
   {
      return distance_between({x: x1b, y: y1b}, {x: x2, y: y2});
   }
   else if (left)
   {
      return x1 - x2b;
   }
   else if (right)
   {
      return x2 - x1b;
   }
   else if (bottom)
   {
      return y1 - y2b;
   }
   else if (top)
   {
      return y2 - y1b;
   }

   return 0;

}

export function distance_between(a, b)
{
   return new Ray(a, b).distance;
}

export function grids_between_tokens(a, b)
{
   return Math.floor(distance_between_rect(a, b) / canvas.grid.size) + 1
}

export function tokens_close_enough(a, b, maxDistance)
{
   const distance = grids_between_tokens(a, b);
   return maxDistance >= distance;
}

export function findSimilarItem(items, findItem)
{

   const itemSimilarities = MODULE_SETTINGS.ITEM_SIMILARITIES;

   const findItemId = findItem?.id ?? findItem?._id;

   return items.find(item =>
   {
      const itemId = item.id ?? item._id;
      if (itemId === findItemId)
      {
         return true;
      }

      const itemData = item instanceof Item ? item.data : item;
      for (const path of itemSimilarities)
      {
         if (getProperty(itemData, path) !== getProperty(findItem, path))
         {
            return false;
         }
      }

      return true;
   });
}

export async function getToken(documentUuid)
{
   const document = await fromUuid(documentUuid);
   return document?.token ?? document;
}

export function is_UUID(inId)
{
   return typeof inId === "string"
    && (inId.match(/\./g) || []).length
    && !inId.endsWith(".");
}

export function getUuid(target)
{
   // If it's an actor, get its TokenDocument
   // If it's a token, get its Document
   // If it's a TokenDocument, just use it
   // Otherwise fail
   const document = getDocument(target);
   return document?.uuid ?? false;
}

export function getDocument(target)
{
   if (target instanceof foundry.abstract.Document)
   {
      return target;
   }
   return target?.document;
}

export function is_real_number(inNumber)
{
   return !isNaN(inNumber)
    && typeof inNumber === "number"
    && isFinite(inNumber);
}

export function dialogLayout({title = "Item Piles", message, icon = "fas fa-exclamation-triangle", extraHtml = ""} = {})
{
   return `
    <div class="item-piles-dialog">
        <p><i style="font-size:3rem;" class="${icon}"></i></p>
        <p style="margin-bottom: 1rem"><strong style="font-size:1.2rem;">${title}</strong></p>
        <p>${message}</p>
        ${extraHtml}
    </div>
    `;
}

export function isActiveGM(user)
{
   return user.active && user.isGM;
}

export function getActiveGMs()
{
   return game.users.filter(isActiveGM);
}

export function isResponsibleGM()
{
   if (!game.user.isGM)
   {
      return false;
   }
   return !getActiveGMs().some(other => other.data._id < game.user.data._id);
}