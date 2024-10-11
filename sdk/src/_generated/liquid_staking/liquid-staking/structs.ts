import * as reified from "../../_framework/reified";
import { Bag } from "../../_dependencies/source/0x2/bag/structs";
import { Balance } from "../../_dependencies/source/0x2/balance/structs";
import { TreasuryCap } from "../../_dependencies/source/0x2/coin/structs";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import { SUI } from "../../_dependencies/source/0x2/sui/structs";
import {
  PhantomReified,
  PhantomToTypeStr,
  PhantomTypeArgument,
  Reified,
  StructClass,
  ToField,
  ToPhantomTypeArgument,
  ToTypeStr,
  assertFieldsWithTypesArgsMatch,
  assertReifiedTypeArgsMatch,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  extractType,
  phantom,
  ToTypeStr as ToPhantom,
} from "../../_framework/reified";
import {
  FieldsWithTypes,
  composeSuiType,
  compressSuiType,
  parseTypeName,
} from "../../_framework/util";
import { Cell } from "../cell/structs";
import { FeeConfig } from "../fees/structs";
import { PKG_V1 } from "../index";
import { Storage } from "../storage/structs";
import { Version } from "../version/structs";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== AdminCap =============================== */

export function isAdminCap(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::AdminCap` + "<");
}

export interface AdminCapFields<P extends PhantomTypeArgument> {
  id: ToField<UID>;
}

export type AdminCapReified<P extends PhantomTypeArgument> = Reified<
  AdminCap<P>,
  AdminCapFields<P>
>;

export class AdminCap<P extends PhantomTypeArgument> implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::AdminCap`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = AdminCap.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::AdminCap<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = AdminCap.$isPhantom;

  readonly id: ToField<UID>;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: AdminCapFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      AdminCap.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::AdminCap<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): AdminCapReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: AdminCap.$typeName,
      fullTypeName: composeSuiType(
        AdminCap.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::AdminCap<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: AdminCap.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        AdminCap.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        AdminCap.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => AdminCap.fromBcs(P, data),
      bcs: AdminCap.bcs,
      fromJSONField: (field: any) => AdminCap.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) => AdminCap.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        AdminCap.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        AdminCap.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        AdminCap.fetch(client, P, id),
      new: (fields: AdminCapFields<ToPhantomTypeArgument<P>>) => {
        return new AdminCap([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return AdminCap.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<AdminCap<ToPhantomTypeArgument<P>>>> {
    return phantom(AdminCap.reified(P));
  }
  static get p() {
    return AdminCap.phantom;
  }

  static get bcs() {
    return bcs.struct("AdminCap", {
      id: UID.bcs,
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    return AdminCap.reified(typeArg).new({
      id: decodeFromFields(UID.reified(), fields.id),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    if (!isAdminCap(item.type)) {
      throw new Error("not a AdminCap type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return AdminCap.reified(typeArg).new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    return AdminCap.fromFields(typeArg, AdminCap.bcs.parse(data));
  }

  toJSONField() {
    return {
      id: this.id,
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    return AdminCap.reified(typeArg).new({
      id: decodeFromJSONField(UID.reified(), field.id),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== AdminCap.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(AdminCap.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return AdminCap.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isAdminCap(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a AdminCap object`,
      );
    }
    return AdminCap.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): AdminCap<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isAdminCap(data.bcs.type)) {
        throw new Error(`object at is not a AdminCap object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return AdminCap.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return AdminCap.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<AdminCap<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching AdminCap object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isAdminCap(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a AdminCap object`);
    }

    return AdminCap.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== CollectFeesEvent =============================== */

export function isCollectFeesEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::CollectFeesEvent` + "<");
}

export interface CollectFeesEventFields<P extends PhantomTypeArgument> {
  amount: ToField<"u64">;
}

export type CollectFeesEventReified<P extends PhantomTypeArgument> = Reified<
  CollectFeesEvent<P>,
  CollectFeesEventFields<P>
>;

export class CollectFeesEvent<P extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::CollectFeesEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = CollectFeesEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::CollectFeesEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = CollectFeesEvent.$isPhantom;

  readonly amount: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: CollectFeesEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      CollectFeesEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::CollectFeesEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.amount = fields.amount;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): CollectFeesEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: CollectFeesEvent.$typeName,
      fullTypeName: composeSuiType(
        CollectFeesEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::CollectFeesEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: CollectFeesEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        CollectFeesEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        CollectFeesEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => CollectFeesEvent.fromBcs(P, data),
      bcs: CollectFeesEvent.bcs,
      fromJSONField: (field: any) => CollectFeesEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) =>
        CollectFeesEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        CollectFeesEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        CollectFeesEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        CollectFeesEvent.fetch(client, P, id),
      new: (fields: CollectFeesEventFields<ToPhantomTypeArgument<P>>) => {
        return new CollectFeesEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return CollectFeesEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<CollectFeesEvent<ToPhantomTypeArgument<P>>>> {
    return phantom(CollectFeesEvent.reified(P));
  }
  static get p() {
    return CollectFeesEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("CollectFeesEvent", {
      amount: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    return CollectFeesEvent.reified(typeArg).new({
      amount: decodeFromFields("u64", fields.amount),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    if (!isCollectFeesEvent(item.type)) {
      throw new Error("not a CollectFeesEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return CollectFeesEvent.reified(typeArg).new({
      amount: decodeFromFieldsWithTypes("u64", item.fields.amount),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    return CollectFeesEvent.fromFields(
      typeArg,
      CollectFeesEvent.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      amount: this.amount.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    return CollectFeesEvent.reified(typeArg).new({
      amount: decodeFromJSONField("u64", field.amount),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== CollectFeesEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(CollectFeesEvent.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return CollectFeesEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isCollectFeesEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a CollectFeesEvent object`,
      );
    }
    return CollectFeesEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): CollectFeesEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isCollectFeesEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a CollectFeesEvent object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return CollectFeesEvent.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return CollectFeesEvent.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<CollectFeesEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching CollectFeesEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isCollectFeesEvent(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a CollectFeesEvent object`);
    }

    return CollectFeesEvent.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== DecreaseValidatorStakeEvent =============================== */

export function isDecreaseValidatorStakeEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(
    `${PKG_V1}::liquid_staking::DecreaseValidatorStakeEvent` + "<",
  );
}

export interface DecreaseValidatorStakeEventFields<
  P extends PhantomTypeArgument,
> {
  stakingPoolId: ToField<ID>;
  amount: ToField<"u64">;
}

export type DecreaseValidatorStakeEventReified<P extends PhantomTypeArgument> =
  Reified<DecreaseValidatorStakeEvent<P>, DecreaseValidatorStakeEventFields<P>>;

export class DecreaseValidatorStakeEvent<P extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::DecreaseValidatorStakeEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = DecreaseValidatorStakeEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::DecreaseValidatorStakeEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = DecreaseValidatorStakeEvent.$isPhantom;

  readonly stakingPoolId: ToField<ID>;
  readonly amount: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: DecreaseValidatorStakeEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      DecreaseValidatorStakeEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::DecreaseValidatorStakeEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.stakingPoolId = fields.stakingPoolId;
    this.amount = fields.amount;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): DecreaseValidatorStakeEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: DecreaseValidatorStakeEvent.$typeName,
      fullTypeName: composeSuiType(
        DecreaseValidatorStakeEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::DecreaseValidatorStakeEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: DecreaseValidatorStakeEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        DecreaseValidatorStakeEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        DecreaseValidatorStakeEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) =>
        DecreaseValidatorStakeEvent.fromBcs(P, data),
      bcs: DecreaseValidatorStakeEvent.bcs,
      fromJSONField: (field: any) =>
        DecreaseValidatorStakeEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) =>
        DecreaseValidatorStakeEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        DecreaseValidatorStakeEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        DecreaseValidatorStakeEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        DecreaseValidatorStakeEvent.fetch(client, P, id),
      new: (
        fields: DecreaseValidatorStakeEventFields<ToPhantomTypeArgument<P>>,
      ) => {
        return new DecreaseValidatorStakeEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return DecreaseValidatorStakeEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<
    ToTypeStr<DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>>>
  > {
    return phantom(DecreaseValidatorStakeEvent.reified(P));
  }
  static get p() {
    return DecreaseValidatorStakeEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("DecreaseValidatorStakeEvent", {
      staking_pool_id: ID.bcs,
      amount: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return DecreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromFields(ID.reified(), fields.staking_pool_id),
      amount: decodeFromFields("u64", fields.amount),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (!isDecreaseValidatorStakeEvent(item.type)) {
      throw new Error("not a DecreaseValidatorStakeEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return DecreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.staking_pool_id,
      ),
      amount: decodeFromFieldsWithTypes("u64", item.fields.amount),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return DecreaseValidatorStakeEvent.fromFields(
      typeArg,
      DecreaseValidatorStakeEvent.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      stakingPoolId: this.stakingPoolId,
      amount: this.amount.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return DecreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromJSONField(ID.reified(), field.stakingPoolId),
      amount: decodeFromJSONField("u64", field.amount),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== DecreaseValidatorStakeEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(
        DecreaseValidatorStakeEvent.$typeName,
        extractType(typeArg),
      ),
      json.$typeArgs,
      [typeArg],
    );

    return DecreaseValidatorStakeEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isDecreaseValidatorStakeEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a DecreaseValidatorStakeEvent object`,
      );
    }
    return DecreaseValidatorStakeEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isDecreaseValidatorStakeEvent(data.bcs.type)
      ) {
        throw new Error(
          `object at is not a DecreaseValidatorStakeEvent object`,
        );
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return DecreaseValidatorStakeEvent.fromBcs(
        typeArg,
        fromB64(data.bcs.bcsBytes),
      );
    }
    if (data.content) {
      return DecreaseValidatorStakeEvent.fromSuiParsedData(
        typeArg,
        data.content,
      );
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<DecreaseValidatorStakeEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching DecreaseValidatorStakeEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isDecreaseValidatorStakeEvent(res.data.bcs.type)
    ) {
      throw new Error(
        `object at id ${id} is not a DecreaseValidatorStakeEvent object`,
      );
    }

    return DecreaseValidatorStakeEvent.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== EpochChangedEvent =============================== */

export function isEpochChangedEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::EpochChangedEvent` + "<");
}

export interface EpochChangedEventFields<P extends PhantomTypeArgument> {
  oldSuiSupply: ToField<"u64">;
  newSuiSupply: ToField<"u64">;
  lstSupply: ToField<"u64">;
  spreadFee: ToField<"u64">;
}

export type EpochChangedEventReified<P extends PhantomTypeArgument> = Reified<
  EpochChangedEvent<P>,
  EpochChangedEventFields<P>
>;

export class EpochChangedEvent<P extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::EpochChangedEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = EpochChangedEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::EpochChangedEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = EpochChangedEvent.$isPhantom;

  readonly oldSuiSupply: ToField<"u64">;
  readonly newSuiSupply: ToField<"u64">;
  readonly lstSupply: ToField<"u64">;
  readonly spreadFee: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: EpochChangedEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      EpochChangedEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::EpochChangedEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.oldSuiSupply = fields.oldSuiSupply;
    this.newSuiSupply = fields.newSuiSupply;
    this.lstSupply = fields.lstSupply;
    this.spreadFee = fields.spreadFee;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): EpochChangedEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: EpochChangedEvent.$typeName,
      fullTypeName: composeSuiType(
        EpochChangedEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::EpochChangedEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: EpochChangedEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        EpochChangedEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        EpochChangedEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => EpochChangedEvent.fromBcs(P, data),
      bcs: EpochChangedEvent.bcs,
      fromJSONField: (field: any) => EpochChangedEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) =>
        EpochChangedEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        EpochChangedEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        EpochChangedEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        EpochChangedEvent.fetch(client, P, id),
      new: (fields: EpochChangedEventFields<ToPhantomTypeArgument<P>>) => {
        return new EpochChangedEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return EpochChangedEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<EpochChangedEvent<ToPhantomTypeArgument<P>>>> {
    return phantom(EpochChangedEvent.reified(P));
  }
  static get p() {
    return EpochChangedEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("EpochChangedEvent", {
      old_sui_supply: bcs.u64(),
      new_sui_supply: bcs.u64(),
      lst_supply: bcs.u64(),
      spread_fee: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    return EpochChangedEvent.reified(typeArg).new({
      oldSuiSupply: decodeFromFields("u64", fields.old_sui_supply),
      newSuiSupply: decodeFromFields("u64", fields.new_sui_supply),
      lstSupply: decodeFromFields("u64", fields.lst_supply),
      spreadFee: decodeFromFields("u64", fields.spread_fee),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    if (!isEpochChangedEvent(item.type)) {
      throw new Error("not a EpochChangedEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return EpochChangedEvent.reified(typeArg).new({
      oldSuiSupply: decodeFromFieldsWithTypes(
        "u64",
        item.fields.old_sui_supply,
      ),
      newSuiSupply: decodeFromFieldsWithTypes(
        "u64",
        item.fields.new_sui_supply,
      ),
      lstSupply: decodeFromFieldsWithTypes("u64", item.fields.lst_supply),
      spreadFee: decodeFromFieldsWithTypes("u64", item.fields.spread_fee),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    return EpochChangedEvent.fromFields(
      typeArg,
      EpochChangedEvent.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      oldSuiSupply: this.oldSuiSupply.toString(),
      newSuiSupply: this.newSuiSupply.toString(),
      lstSupply: this.lstSupply.toString(),
      spreadFee: this.spreadFee.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    return EpochChangedEvent.reified(typeArg).new({
      oldSuiSupply: decodeFromJSONField("u64", field.oldSuiSupply),
      newSuiSupply: decodeFromJSONField("u64", field.newSuiSupply),
      lstSupply: decodeFromJSONField("u64", field.lstSupply),
      spreadFee: decodeFromJSONField("u64", field.spreadFee),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== EpochChangedEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(EpochChangedEvent.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return EpochChangedEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isEpochChangedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a EpochChangedEvent object`,
      );
    }
    return EpochChangedEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): EpochChangedEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isEpochChangedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a EpochChangedEvent object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return EpochChangedEvent.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return EpochChangedEvent.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<EpochChangedEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching EpochChangedEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isEpochChangedEvent(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a EpochChangedEvent object`);
    }

    return EpochChangedEvent.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== IncreaseValidatorStakeEvent =============================== */

export function isIncreaseValidatorStakeEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(
    `${PKG_V1}::liquid_staking::IncreaseValidatorStakeEvent` + "<",
  );
}

export interface IncreaseValidatorStakeEventFields<
  P extends PhantomTypeArgument,
> {
  stakingPoolId: ToField<ID>;
  amount: ToField<"u64">;
}

export type IncreaseValidatorStakeEventReified<P extends PhantomTypeArgument> =
  Reified<IncreaseValidatorStakeEvent<P>, IncreaseValidatorStakeEventFields<P>>;

export class IncreaseValidatorStakeEvent<P extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::IncreaseValidatorStakeEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = IncreaseValidatorStakeEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::IncreaseValidatorStakeEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = IncreaseValidatorStakeEvent.$isPhantom;

  readonly stakingPoolId: ToField<ID>;
  readonly amount: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: IncreaseValidatorStakeEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      IncreaseValidatorStakeEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::IncreaseValidatorStakeEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.stakingPoolId = fields.stakingPoolId;
    this.amount = fields.amount;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): IncreaseValidatorStakeEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: IncreaseValidatorStakeEvent.$typeName,
      fullTypeName: composeSuiType(
        IncreaseValidatorStakeEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::IncreaseValidatorStakeEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: IncreaseValidatorStakeEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        IncreaseValidatorStakeEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        IncreaseValidatorStakeEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) =>
        IncreaseValidatorStakeEvent.fromBcs(P, data),
      bcs: IncreaseValidatorStakeEvent.bcs,
      fromJSONField: (field: any) =>
        IncreaseValidatorStakeEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) =>
        IncreaseValidatorStakeEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        IncreaseValidatorStakeEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        IncreaseValidatorStakeEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        IncreaseValidatorStakeEvent.fetch(client, P, id),
      new: (
        fields: IncreaseValidatorStakeEventFields<ToPhantomTypeArgument<P>>,
      ) => {
        return new IncreaseValidatorStakeEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return IncreaseValidatorStakeEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<
    ToTypeStr<IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>>>
  > {
    return phantom(IncreaseValidatorStakeEvent.reified(P));
  }
  static get p() {
    return IncreaseValidatorStakeEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("IncreaseValidatorStakeEvent", {
      staking_pool_id: ID.bcs,
      amount: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return IncreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromFields(ID.reified(), fields.staking_pool_id),
      amount: decodeFromFields("u64", fields.amount),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (!isIncreaseValidatorStakeEvent(item.type)) {
      throw new Error("not a IncreaseValidatorStakeEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return IncreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.staking_pool_id,
      ),
      amount: decodeFromFieldsWithTypes("u64", item.fields.amount),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return IncreaseValidatorStakeEvent.fromFields(
      typeArg,
      IncreaseValidatorStakeEvent.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      stakingPoolId: this.stakingPoolId,
      amount: this.amount.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    return IncreaseValidatorStakeEvent.reified(typeArg).new({
      stakingPoolId: decodeFromJSONField(ID.reified(), field.stakingPoolId),
      amount: decodeFromJSONField("u64", field.amount),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== IncreaseValidatorStakeEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(
        IncreaseValidatorStakeEvent.$typeName,
        extractType(typeArg),
      ),
      json.$typeArgs,
      [typeArg],
    );

    return IncreaseValidatorStakeEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isIncreaseValidatorStakeEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a IncreaseValidatorStakeEvent object`,
      );
    }
    return IncreaseValidatorStakeEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isIncreaseValidatorStakeEvent(data.bcs.type)
      ) {
        throw new Error(
          `object at is not a IncreaseValidatorStakeEvent object`,
        );
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return IncreaseValidatorStakeEvent.fromBcs(
        typeArg,
        fromB64(data.bcs.bcsBytes),
      );
    }
    if (data.content) {
      return IncreaseValidatorStakeEvent.fromSuiParsedData(
        typeArg,
        data.content,
      );
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<IncreaseValidatorStakeEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching IncreaseValidatorStakeEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isIncreaseValidatorStakeEvent(res.data.bcs.type)
    ) {
      throw new Error(
        `object at id ${id} is not a IncreaseValidatorStakeEvent object`,
      );
    }

    return IncreaseValidatorStakeEvent.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== LiquidStakingInfo =============================== */

export function isLiquidStakingInfo(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::LiquidStakingInfo` + "<");
}

export interface LiquidStakingInfoFields<P extends PhantomTypeArgument> {
  id: ToField<UID>;
  lstTreasuryCap: ToField<TreasuryCap<P>>;
  feeConfig: ToField<Cell<FeeConfig>>;
  fees: ToField<Balance<ToPhantom<SUI>>>;
  accruedSpreadFees: ToField<"u64">;
  storage: ToField<Storage>;
  version: ToField<Version>;
  extraFields: ToField<Bag>;
}

export type LiquidStakingInfoReified<P extends PhantomTypeArgument> = Reified<
  LiquidStakingInfo<P>,
  LiquidStakingInfoFields<P>
>;

export class LiquidStakingInfo<P extends PhantomTypeArgument>
  implements StructClass
{
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::LiquidStakingInfo`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = LiquidStakingInfo.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::LiquidStakingInfo<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = LiquidStakingInfo.$isPhantom;

  readonly id: ToField<UID>;
  readonly lstTreasuryCap: ToField<TreasuryCap<P>>;
  readonly feeConfig: ToField<Cell<FeeConfig>>;
  readonly fees: ToField<Balance<ToPhantom<SUI>>>;
  readonly accruedSpreadFees: ToField<"u64">;
  readonly storage: ToField<Storage>;
  readonly version: ToField<Version>;
  readonly extraFields: ToField<Bag>;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: LiquidStakingInfoFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      LiquidStakingInfo.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::LiquidStakingInfo<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.lstTreasuryCap = fields.lstTreasuryCap;
    this.feeConfig = fields.feeConfig;
    this.fees = fields.fees;
    this.accruedSpreadFees = fields.accruedSpreadFees;
    this.storage = fields.storage;
    this.version = fields.version;
    this.extraFields = fields.extraFields;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): LiquidStakingInfoReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: LiquidStakingInfo.$typeName,
      fullTypeName: composeSuiType(
        LiquidStakingInfo.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::LiquidStakingInfo<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: LiquidStakingInfo.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        LiquidStakingInfo.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        LiquidStakingInfo.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => LiquidStakingInfo.fromBcs(P, data),
      bcs: LiquidStakingInfo.bcs,
      fromJSONField: (field: any) => LiquidStakingInfo.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) =>
        LiquidStakingInfo.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        LiquidStakingInfo.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        LiquidStakingInfo.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        LiquidStakingInfo.fetch(client, P, id),
      new: (fields: LiquidStakingInfoFields<ToPhantomTypeArgument<P>>) => {
        return new LiquidStakingInfo([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return LiquidStakingInfo.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<LiquidStakingInfo<ToPhantomTypeArgument<P>>>> {
    return phantom(LiquidStakingInfo.reified(P));
  }
  static get p() {
    return LiquidStakingInfo.phantom;
  }

  static get bcs() {
    return bcs.struct("LiquidStakingInfo", {
      id: UID.bcs,
      lst_treasury_cap: TreasuryCap.bcs,
      fee_config: Cell.bcs(FeeConfig.bcs),
      fees: Balance.bcs,
      accrued_spread_fees: bcs.u64(),
      storage: Storage.bcs,
      version: Version.bcs,
      extra_fields: Bag.bcs,
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    return LiquidStakingInfo.reified(typeArg).new({
      id: decodeFromFields(UID.reified(), fields.id),
      lstTreasuryCap: decodeFromFields(
        TreasuryCap.reified(typeArg),
        fields.lst_treasury_cap,
      ),
      feeConfig: decodeFromFields(
        Cell.reified(FeeConfig.reified()),
        fields.fee_config,
      ),
      fees: decodeFromFields(
        Balance.reified(reified.phantom(SUI.reified())),
        fields.fees,
      ),
      accruedSpreadFees: decodeFromFields("u64", fields.accrued_spread_fees),
      storage: decodeFromFields(Storage.reified(), fields.storage),
      version: decodeFromFields(Version.reified(), fields.version),
      extraFields: decodeFromFields(Bag.reified(), fields.extra_fields),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    if (!isLiquidStakingInfo(item.type)) {
      throw new Error("not a LiquidStakingInfo type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return LiquidStakingInfo.reified(typeArg).new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      lstTreasuryCap: decodeFromFieldsWithTypes(
        TreasuryCap.reified(typeArg),
        item.fields.lst_treasury_cap,
      ),
      feeConfig: decodeFromFieldsWithTypes(
        Cell.reified(FeeConfig.reified()),
        item.fields.fee_config,
      ),
      fees: decodeFromFieldsWithTypes(
        Balance.reified(reified.phantom(SUI.reified())),
        item.fields.fees,
      ),
      accruedSpreadFees: decodeFromFieldsWithTypes(
        "u64",
        item.fields.accrued_spread_fees,
      ),
      storage: decodeFromFieldsWithTypes(
        Storage.reified(),
        item.fields.storage,
      ),
      version: decodeFromFieldsWithTypes(
        Version.reified(),
        item.fields.version,
      ),
      extraFields: decodeFromFieldsWithTypes(
        Bag.reified(),
        item.fields.extra_fields,
      ),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    return LiquidStakingInfo.fromFields(
      typeArg,
      LiquidStakingInfo.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      id: this.id,
      lstTreasuryCap: this.lstTreasuryCap.toJSONField(),
      feeConfig: this.feeConfig.toJSONField(),
      fees: this.fees.toJSONField(),
      accruedSpreadFees: this.accruedSpreadFees.toString(),
      storage: this.storage.toJSONField(),
      version: this.version.toJSONField(),
      extraFields: this.extraFields.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    return LiquidStakingInfo.reified(typeArg).new({
      id: decodeFromJSONField(UID.reified(), field.id),
      lstTreasuryCap: decodeFromJSONField(
        TreasuryCap.reified(typeArg),
        field.lstTreasuryCap,
      ),
      feeConfig: decodeFromJSONField(
        Cell.reified(FeeConfig.reified()),
        field.feeConfig,
      ),
      fees: decodeFromJSONField(
        Balance.reified(reified.phantom(SUI.reified())),
        field.fees,
      ),
      accruedSpreadFees: decodeFromJSONField("u64", field.accruedSpreadFees),
      storage: decodeFromJSONField(Storage.reified(), field.storage),
      version: decodeFromJSONField(Version.reified(), field.version),
      extraFields: decodeFromJSONField(Bag.reified(), field.extraFields),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== LiquidStakingInfo.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(LiquidStakingInfo.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return LiquidStakingInfo.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isLiquidStakingInfo(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a LiquidStakingInfo object`,
      );
    }
    return LiquidStakingInfo.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): LiquidStakingInfo<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isLiquidStakingInfo(data.bcs.type)
      ) {
        throw new Error(`object at is not a LiquidStakingInfo object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return LiquidStakingInfo.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return LiquidStakingInfo.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<LiquidStakingInfo<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching LiquidStakingInfo object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isLiquidStakingInfo(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a LiquidStakingInfo object`);
    }

    return LiquidStakingInfo.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== MintEvent =============================== */

export function isMintEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::MintEvent` + "<");
}

export interface MintEventFields<P extends PhantomTypeArgument> {
  suiAmountIn: ToField<"u64">;
  lstAmountOut: ToField<"u64">;
  feeAmount: ToField<"u64">;
}

export type MintEventReified<P extends PhantomTypeArgument> = Reified<
  MintEvent<P>,
  MintEventFields<P>
>;

export class MintEvent<P extends PhantomTypeArgument> implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::MintEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = MintEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::MintEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = MintEvent.$isPhantom;

  readonly suiAmountIn: ToField<"u64">;
  readonly lstAmountOut: ToField<"u64">;
  readonly feeAmount: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: MintEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      MintEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::MintEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.suiAmountIn = fields.suiAmountIn;
    this.lstAmountOut = fields.lstAmountOut;
    this.feeAmount = fields.feeAmount;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): MintEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: MintEvent.$typeName,
      fullTypeName: composeSuiType(
        MintEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::MintEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: MintEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        MintEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        MintEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => MintEvent.fromBcs(P, data),
      bcs: MintEvent.bcs,
      fromJSONField: (field: any) => MintEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) => MintEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        MintEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        MintEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        MintEvent.fetch(client, P, id),
      new: (fields: MintEventFields<ToPhantomTypeArgument<P>>) => {
        return new MintEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return MintEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<MintEvent<ToPhantomTypeArgument<P>>>> {
    return phantom(MintEvent.reified(P));
  }
  static get p() {
    return MintEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("MintEvent", {
      sui_amount_in: bcs.u64(),
      lst_amount_out: bcs.u64(),
      fee_amount: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    return MintEvent.reified(typeArg).new({
      suiAmountIn: decodeFromFields("u64", fields.sui_amount_in),
      lstAmountOut: decodeFromFields("u64", fields.lst_amount_out),
      feeAmount: decodeFromFields("u64", fields.fee_amount),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    if (!isMintEvent(item.type)) {
      throw new Error("not a MintEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return MintEvent.reified(typeArg).new({
      suiAmountIn: decodeFromFieldsWithTypes("u64", item.fields.sui_amount_in),
      lstAmountOut: decodeFromFieldsWithTypes(
        "u64",
        item.fields.lst_amount_out,
      ),
      feeAmount: decodeFromFieldsWithTypes("u64", item.fields.fee_amount),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    return MintEvent.fromFields(typeArg, MintEvent.bcs.parse(data));
  }

  toJSONField() {
    return {
      suiAmountIn: this.suiAmountIn.toString(),
      lstAmountOut: this.lstAmountOut.toString(),
      feeAmount: this.feeAmount.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    return MintEvent.reified(typeArg).new({
      suiAmountIn: decodeFromJSONField("u64", field.suiAmountIn),
      lstAmountOut: decodeFromJSONField("u64", field.lstAmountOut),
      feeAmount: decodeFromJSONField("u64", field.feeAmount),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== MintEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(MintEvent.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return MintEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isMintEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a MintEvent object`,
      );
    }
    return MintEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): MintEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isMintEvent(data.bcs.type)) {
        throw new Error(`object at is not a MintEvent object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return MintEvent.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return MintEvent.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<MintEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching MintEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isMintEvent(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a MintEvent object`);
    }

    return MintEvent.fromSuiObjectData(typeArg, res.data);
  }
}

/* ============================== RedeemEvent =============================== */

export function isRedeemEvent(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::liquid_staking::RedeemEvent` + "<");
}

export interface RedeemEventFields<P extends PhantomTypeArgument> {
  lstAmountIn: ToField<"u64">;
  suiAmountOut: ToField<"u64">;
  feeAmount: ToField<"u64">;
}

export type RedeemEventReified<P extends PhantomTypeArgument> = Reified<
  RedeemEvent<P>,
  RedeemEventFields<P>
>;

export class RedeemEvent<P extends PhantomTypeArgument> implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::liquid_staking::RedeemEvent`;
  static readonly $numTypeParams = 1;
  static readonly $isPhantom = [true] as const;

  readonly $typeName = RedeemEvent.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::liquid_staking::RedeemEvent<${PhantomToTypeStr<P>}>`;
  readonly $typeArgs: [PhantomToTypeStr<P>];
  readonly $isPhantom = RedeemEvent.$isPhantom;

  readonly lstAmountIn: ToField<"u64">;
  readonly suiAmountOut: ToField<"u64">;
  readonly feeAmount: ToField<"u64">;

  private constructor(
    typeArgs: [PhantomToTypeStr<P>],
    fields: RedeemEventFields<P>,
  ) {
    this.$fullTypeName = composeSuiType(
      RedeemEvent.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::liquid_staking::RedeemEvent<${PhantomToTypeStr<P>}>`;
    this.$typeArgs = typeArgs;

    this.lstAmountIn = fields.lstAmountIn;
    this.suiAmountOut = fields.suiAmountOut;
    this.feeAmount = fields.feeAmount;
  }

  static reified<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): RedeemEventReified<ToPhantomTypeArgument<P>> {
    return {
      typeName: RedeemEvent.$typeName,
      fullTypeName: composeSuiType(
        RedeemEvent.$typeName,
        ...[extractType(P)],
      ) as `${typeof PKG_V1}::liquid_staking::RedeemEvent<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`,
      typeArgs: [extractType(P)] as [
        PhantomToTypeStr<ToPhantomTypeArgument<P>>,
      ],
      isPhantom: RedeemEvent.$isPhantom,
      reifiedTypeArgs: [P],
      fromFields: (fields: Record<string, any>) =>
        RedeemEvent.fromFields(P, fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        RedeemEvent.fromFieldsWithTypes(P, item),
      fromBcs: (data: Uint8Array) => RedeemEvent.fromBcs(P, data),
      bcs: RedeemEvent.bcs,
      fromJSONField: (field: any) => RedeemEvent.fromJSONField(P, field),
      fromJSON: (json: Record<string, any>) => RedeemEvent.fromJSON(P, json),
      fromSuiParsedData: (content: SuiParsedData) =>
        RedeemEvent.fromSuiParsedData(P, content),
      fromSuiObjectData: (content: SuiObjectData) =>
        RedeemEvent.fromSuiObjectData(P, content),
      fetch: async (client: SuiClient, id: string) =>
        RedeemEvent.fetch(client, P, id),
      new: (fields: RedeemEventFields<ToPhantomTypeArgument<P>>) => {
        return new RedeemEvent([extractType(P)], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return RedeemEvent.reified;
  }

  static phantom<P extends PhantomReified<PhantomTypeArgument>>(
    P: P,
  ): PhantomReified<ToTypeStr<RedeemEvent<ToPhantomTypeArgument<P>>>> {
    return phantom(RedeemEvent.reified(P));
  }
  static get p() {
    return RedeemEvent.phantom;
  }

  static get bcs() {
    return bcs.struct("RedeemEvent", {
      lst_amount_in: bcs.u64(),
      sui_amount_out: bcs.u64(),
      fee_amount: bcs.u64(),
    });
  }

  static fromFields<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    fields: Record<string, any>,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    return RedeemEvent.reified(typeArg).new({
      lstAmountIn: decodeFromFields("u64", fields.lst_amount_in),
      suiAmountOut: decodeFromFields("u64", fields.sui_amount_out),
      feeAmount: decodeFromFields("u64", fields.fee_amount),
    });
  }

  static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    item: FieldsWithTypes,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    if (!isRedeemEvent(item.type)) {
      throw new Error("not a RedeemEvent type");
    }
    assertFieldsWithTypesArgsMatch(item, [typeArg]);

    return RedeemEvent.reified(typeArg).new({
      lstAmountIn: decodeFromFieldsWithTypes("u64", item.fields.lst_amount_in),
      suiAmountOut: decodeFromFieldsWithTypes(
        "u64",
        item.fields.sui_amount_out,
      ),
      feeAmount: decodeFromFieldsWithTypes("u64", item.fields.fee_amount),
    });
  }

  static fromBcs<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: Uint8Array,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    return RedeemEvent.fromFields(typeArg, RedeemEvent.bcs.parse(data));
  }

  toJSONField() {
    return {
      lstAmountIn: this.lstAmountIn.toString(),
      suiAmountOut: this.suiAmountOut.toString(),
      feeAmount: this.feeAmount.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    field: any,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    return RedeemEvent.reified(typeArg).new({
      lstAmountIn: decodeFromJSONField("u64", field.lstAmountIn),
      suiAmountOut: decodeFromJSONField("u64", field.suiAmountOut),
      feeAmount: decodeFromJSONField("u64", field.feeAmount),
    });
  }

  static fromJSON<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    json: Record<string, any>,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    if (json.$typeName !== RedeemEvent.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }
    assertReifiedTypeArgsMatch(
      composeSuiType(RedeemEvent.$typeName, extractType(typeArg)),
      json.$typeArgs,
      [typeArg],
    );

    return RedeemEvent.fromJSONField(typeArg, json);
  }

  static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    content: SuiParsedData,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isRedeemEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a RedeemEvent object`,
      );
    }
    return RedeemEvent.fromFieldsWithTypes(typeArg, content);
  }

  static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>(
    typeArg: P,
    data: SuiObjectData,
  ): RedeemEvent<ToPhantomTypeArgument<P>> {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isRedeemEvent(data.bcs.type)) {
        throw new Error(`object at is not a RedeemEvent object`);
      }

      const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs;
      if (gotTypeArgs.length !== 1) {
        throw new Error(
          `type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`,
        );
      }
      const gotTypeArg = compressSuiType(gotTypeArgs[0]);
      const expectedTypeArg = compressSuiType(extractType(typeArg));
      if (gotTypeArg !== compressSuiType(extractType(typeArg))) {
        throw new Error(
          `type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`,
        );
      }

      return RedeemEvent.fromBcs(typeArg, fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return RedeemEvent.fromSuiParsedData(typeArg, data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch<P extends PhantomReified<PhantomTypeArgument>>(
    client: SuiClient,
    typeArg: P,
    id: string,
  ): Promise<RedeemEvent<ToPhantomTypeArgument<P>>> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching RedeemEvent object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isRedeemEvent(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a RedeemEvent object`);
    }

    return RedeemEvent.fromSuiObjectData(typeArg, res.data);
  }
}
